/**
 * GameStateValidator — terminal draw/win checks after each turn.
 * Does NOT apply moves or search; host game supplies board helpers.
 *
 * Result shapes:
 *   { winner: 1|2, reason: "dux"|"dux-self"|"lone-king"|"immobile"|... }
 *   { winner: 0, reason: "draw-material"|"draw-fifty"|"draw-repetition"|"draw-stalemate" }
 *
 * Games: "latrunculi" | "petteia"
 */
(function (global) {
  "use strict";

  var EMPTY = 0;
  var WHITE = 1;
  var BLACK = 2;
  var WKING = 3;
  var BKING = 4;

  /** 50 moves per player without capture → 100 half-moves. */
  var FIFTY_MOVE_PLY_LIMIT = 100;
  var REPETITION_LIMIT = 3;

  function colorOf(p) {
    if (p === WHITE || p === WKING) return WHITE;
    if (p === BLACK || p === BKING) return BLACK;
    return 0;
  }

  function isKing(p) {
    return p === WKING || p === BKING;
  }

  function materialProfile(board) {
    var wPawns = 0,
      bPawns = 0,
      wKing = 0,
      bKing = 0,
      wTotal = 0,
      bTotal = 0;
    for (var r = 0; r < board.length; r++) {
      for (var c = 0; c < board[r].length; c++) {
        var p = board[r][c];
        if (!p) continue;
        var col = colorOf(p);
        if (col === WHITE) {
          wTotal++;
          if (isKing(p)) wKing = 1;
          else wPawns++;
        } else if (col === BLACK) {
          bTotal++;
          if (isKing(p)) bKing = 1;
          else bPawns++;
        }
      }
    }
    return {
      wPawns: wPawns,
      bPawns: bPawns,
      wKing: wKing,
      bKing: bKing,
      wTotal: wTotal,
      bTotal: bTotal,
      total: wTotal + bTotal
    };
  }

  /**
   * Insufficient material → automatic draw.
   * - 1v1 (any two pieces)
   * - Dux vs Dux (both kings, no pawns)
   * - Dux vs 1 mercenary (bare king vs one pawn, or bare king vs king+one pawn)
   */
  function isInsufficientMaterial(board, game) {
    var m = materialProfile(board);
    if (m.total <= 2) return true;
    var hasDux = game !== "petteia";
    if (!hasDux) {
      /* Petteia: bare 1v1 already covered; also draw if only two armies of size 1. */
      return m.wTotal <= 1 && m.bTotal <= 1;
    }
    if (m.wPawns === 0 && m.bPawns === 0) return true;
    var wBareKing = m.wKing && m.wTotal === 1;
    var bBareKing = m.bKing && m.bTotal === 1;
    if (wBareKing && m.bPawns === 1 && m.bTotal <= 2) return true;
    if (bBareKing && m.wPawns === 1 && m.wTotal <= 2) return true;
    return false;
  }

  function scoreForAi(result, aiSide) {
    if (!result) return null;
    if (!result.winner) return 0;
    if (result.winner === aiSide) return 10000;
    return -10000;
  }

  /**
   * @param {object} ctx
   * @param {number[][]} ctx.board
   * @param {number} ctx.mover - side that just moved
   * @param {string} [ctx.game] - "latrunculi" | "petteia"
   * @param {function} ctx.kingImmobilized(board, player)
   * @param {function} ctx.countPawns(board, player)
   * @param {function} ctx.getMoves(board, player) - legal moves for side to move
   * @param {number} [ctx.halfmoveClock] - plies since last capture
   * @param {number} [ctx.repetitionCount] - visits of current (board, side-to-move) key
   * @param {boolean} [ctx.hasDux]
   */
  function evaluateAfterMove(ctx) {
    var board = ctx.board;
    var mover = ctx.mover;
    var opp = 3 - mover;
    var game = ctx.game || (ctx.hasDux === false ? "petteia" : "latrunculi");

    if (typeof ctx.kingImmobilized === "function") {
      if (ctx.kingImmobilized(board, opp)) {
        return { winner: mover, reason: "dux" };
      }
      if (ctx.kingImmobilized(board, mover)) {
        return { winner: opp, reason: "dux-self" };
      }
    }

    if (isInsufficientMaterial(board, game)) {
      return { winner: 0, reason: "draw-material" };
    }

    if (typeof ctx.countPawns === "function" && ctx.countPawns(board, opp) === 0) {
      return { winner: mover, reason: "lone-king" };
    }

    if (typeof ctx.getMoves === "function") {
      var oppMoves = ctx.getMoves(board, opp);
      if (!oppMoves || oppMoves.length === 0) {
        if (game === "petteia") {
          return { winner: 0, reason: "draw-stalemate" };
        }
        return { winner: mover, reason: "immobile" };
      }
    }

    var half = ctx.halfmoveClock | 0;
    if (half >= FIFTY_MOVE_PLY_LIMIT) {
      return { winner: 0, reason: "draw-fifty" };
    }

    var reps = ctx.repetitionCount | 0;
    if (reps >= REPETITION_LIMIT) {
      return { winner: 0, reason: "draw-repetition" };
    }

    return null;
  }

  /**
   * Lightweight eval hook for AI leaves (no repetition/fifty without search state).
   */
  function evaluateQuiet(board, ai, helpers, game) {
    game = game || "latrunculi";
    if (helpers.kingImmobilized(board, 3 - ai)) return 9000;
    if (helpers.kingImmobilized(board, ai)) return -9000;
    if (isInsufficientMaterial(board, game)) return 0;
    if (helpers.countPawns(board, 3 - ai) === 0) return 8500;
    if (helpers.countPawns(board, ai) === 0) return -8500;
    var moves = helpers.getMovesRaw
      ? helpers.getMovesRaw(board, ai)
      : helpers.getMoves(board, ai);
    if (!moves || !moves.length) {
      return game === "petteia" ? 0 : -9000;
    }
    var oppMoves = helpers.getMovesRaw
      ? helpers.getMovesRaw(board, 3 - ai)
      : helpers.getMoves(board, 3 - ai);
    if (!oppMoves || !oppMoves.length) {
      return game === "petteia" ? 0 : 9000;
    }
    return null;
  }

  global.GameStateValidator = {
    EMPTY: EMPTY,
    WHITE: WHITE,
    BLACK: BLACK,
    FIFTY_MOVE_PLY_LIMIT: FIFTY_MOVE_PLY_LIMIT,
    REPETITION_LIMIT: REPETITION_LIMIT,
    materialProfile: materialProfile,
    isInsufficientMaterial: isInsufficientMaterial,
    evaluateAfterMove: evaluateAfterMove,
    evaluateQuiet: evaluateQuiet,
    scoreForAi: scoreForAi
  };
})(typeof window !== "undefined" ? window : globalThis);
