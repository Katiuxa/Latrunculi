/**
 * Preview only — same Dux horseshoe wreath as the emblem, just a bit wider.
 * Does NOT patch the app.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "assets", "brand");

function bezier(p0, p1, p2, t) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
  };
}

function bezierDeriv(p0, p1, p2, t) {
  const u = 1 - t;
  return {
    x: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p0.x),
    y: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p0.y)
  };
}

function fmt(n) {
  return n.toFixed(2);
}

function leafPath(len, wid) {
  return `M0,0 C${fmt(wid)},${fmt(len * 0.2)} ${fmt(wid * 1.05)},${fmt(len * 0.52)} 0,${fmt(len)} C${fmt(-wid * 1.05)},${fmt(len * 0.52)} ${fmt(-wid)},${fmt(len * 0.2)} 0,0 Z`;
}

function wreathMarkup() {
  /* Same Dux horseshoe as generate-emblem.mjs — only tips/control a bit wider */
  const left = [
    { x: 500, y: 742 },
    { x: 210, y: 540 },
    { x: 348, y: 236 }
  ];
  const right = left.map((p) => ({ x: 1024 - p.x, y: p.y }));
  const n = 8;
  let leaves = "";
  let veins = "";
  let berries = "";
  let stems = "";

  function branch(pts, outwardSign) {
    const [p0, p1, p2] = pts;
    const samples = [];
    for (let i = 0; i <= 24; i++) samples.push(bezier(p0, p1, p2, i / 24));
    const d = samples.map((p, i) => (i ? "L" : "M") + fmt(p.x) + "," + fmt(p.y)).join(" ");
    stems += `<path d="${d}" fill="none" stroke="url(#goldDeep)" stroke-width="11" stroke-linecap="round"/>`;
    stems += `<path d="${d}" fill="none" stroke="url(#gold)" stroke-width="5.5" stroke-linecap="round"/>`;

    for (let i = 0; i < n; i++) {
      const t = 0.07 + (i / (n - 1)) * 0.82;
      const p = bezier(p0, p1, p2, t);
      const dvt = bezierDeriv(p0, p1, p2, t);
      const tang = Math.atan2(dvt.y, dvt.x);
      const outward = tang + (Math.PI / 2) * outwardSign;
      const wobble = i % 2 === 0 ? -0.18 : 0.22;
      const ang = ((outward + wobble) * 180) / Math.PI;
      const grow = 1 - i * 0.055;
      const len = 118 * grow;
      const wid = 32 * grow;
      leaves += `<path fill="url(#leaf)" stroke="#6a4a12" stroke-width="1.6" d="${leafPath(len, wid)}" transform="translate(${fmt(p.x)} ${fmt(p.y)}) rotate(${fmt(ang)})"/>`;
      veins += `<path d="M0,${fmt(len * 0.14)} L0,${fmt(len * 0.78)}" fill="none" stroke="#7a5814" stroke-width="1.35" stroke-linecap="round" opacity="0.45" transform="translate(${fmt(p.x)} ${fmt(p.y)}) rotate(${fmt(ang)})"/>`;
      if (i > 0 && i < n - 1 && i % 2 === 1) {
        const bx = p.x + Math.cos(outward) * 14;
        const by = p.y + Math.sin(outward) * 14;
        berries += `<circle cx="${fmt(bx)}" cy="${fmt(by)}" r="7.2" fill="url(#berry)" stroke="#6a4a12" stroke-width="1.1"/>`;
      }
    }
  }

  branch(left, -1);
  branch(right, 1);

  const knot = `
    <ellipse cx="512" cy="748" rx="28" ry="16" fill="url(#gold)" stroke="#6a4a12" stroke-width="2"/>
    <path d="M486 752 C460 778 448 808 456 828" fill="none" stroke="url(#goldDeep)" stroke-width="8" stroke-linecap="round"/>
    <path d="M538 752 C564 778 576 808 568 828" fill="none" stroke="url(#goldDeep)" stroke-width="8" stroke-linecap="round"/>
    <path d="M486 752 C460 778 448 808 456 828" fill="none" stroke="url(#gold)" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M538 752 C564 778 576 808 568 828" fill="none" stroke="url(#gold)" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M478 736 H546" fill="none" stroke="url(#gold)" stroke-width="9" stroke-linecap="round"/>
  `;

  return stems + leaves + veins + berries + knot;
}

const defs = `<defs>
  <radialGradient id="field" cx="36%" cy="28%" r="78%">
    <stop offset="0%" stop-color="#7a2430"/>
    <stop offset="52%" stop-color="#4a1420"/>
    <stop offset="100%" stop-color="#16070a"/>
  </radialGradient>
  <linearGradient id="gold" x1="220" y1="90" x2="820" y2="940" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#fff4c4"/>
    <stop offset="38%" stop-color="#e8cc6a"/>
    <stop offset="100%" stop-color="#8f6c1c"/>
  </linearGradient>
  <linearGradient id="goldDeep" x1="220" y1="90" x2="820" y2="940" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#c9a227"/>
    <stop offset="100%" stop-color="#6a4a12"/>
  </linearGradient>
  <linearGradient id="leaf" x1="0" y1="0" x2="0.2" y2="1">
    <stop offset="0%" stop-color="#ffe9a0"/>
    <stop offset="45%" stop-color="#e0c36a"/>
    <stop offset="100%" stop-color="#a07a28"/>
  </linearGradient>
  <radialGradient id="berry" cx="35%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#fff0b8"/>
    <stop offset="100%" stop-color="#b8892a"/>
  </radialGradient>
</defs>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
${defs}
  <rect width="1024" height="1024" fill="#2a0c12"/>
  <circle cx="512" cy="512" r="500" fill="url(#field)"/>
  <circle cx="512" cy="512" r="478" fill="none" stroke="url(#gold)" stroke-width="28"/>
  <circle cx="512" cy="512" r="448" fill="none" stroke="#e8cc6a" stroke-width="6" opacity="0.55"/>
  <circle cx="512" cy="512" r="418" fill="none" stroke="url(#gold)" stroke-width="5" opacity="0.7"/>
  <g transform="translate(512 528) scale(1.16) translate(-512 -528)">${wreathMarkup()}</g>
</svg>
`;

fs.mkdirSync(OUT, { recursive: true });
const svgPath = path.join(OUT, "preview-wreath-wider.svg");
const pngPath = path.join(OUT, "preview-wreath-wider.png");
fs.writeFileSync(svgPath, svg.trim() + "\n");
await sharp(Buffer.from(svg)).png().resize(768, 768).toFile(pngPath);
console.log("preview:", path.relative(ROOT, pngPath));
