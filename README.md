# Latrunculi

Ludus Latrunculorum. Roman soldiers on an incised board, on the web and on Android.

Every piece, including the Dux, moves like a rook: any distance along a rank or file, without jumping. An enemy piece falls by custody when two of yours flank it. The Dux cannot be taken that way. You beat it by closing its four sides, even if one side is blocked by its own piece.

Two boards. **Normal** is 8×8, with 8 milites and a Dux. **Britannia** is 8×12, with 12 milites and a Dux. Black moves first.

## Web

https://latrunculi.vercel.app

Code is in `docs/`. That folder is what Vercel publishes.

```bash
node server.js
```

## Android

Capacitor. Version **1.0.89**. Native code is in `android/`. The app HTML is generated with `npm run prepare:android` (do not use `docs/` for the APK).

```bash
npm ci
npm run apk
```

The Play Store keystore stays outside git.

The Android navigation bar is kept clear with native insets in `MainActivity`.
