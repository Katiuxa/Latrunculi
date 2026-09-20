import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = path.join(ROOT, "assets", "brand");

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
  const left = [
    { x: 500, y: 742 },
    { x: 248, y: 548 },
    { x: 392, y: 248 }
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
      const wobble = (i % 2 === 0 ? -0.18 : 0.22);
      const ang = (outward + wobble) * 180 / Math.PI;
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

function emblemInner() {
  return `
  <circle cx="512" cy="512" r="500" fill="url(#field)"/>
  <circle cx="512" cy="512" r="478" fill="none" stroke="url(#gold)" stroke-width="28"/>
  <circle cx="512" cy="512" r="448" fill="none" stroke="#e8cc6a" stroke-width="6" opacity="0.55"/>
  <circle cx="512" cy="512" r="418" fill="none" stroke="url(#gold)" stroke-width="5" opacity="0.7"/>
  <g transform="translate(512 528) scale(1.16) translate(-512 -528)">${wreathMarkup()}</g>
`;
}

function emblemDefs() {
  return `<defs>
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
}

function write(name, svg) {
  const dest = path.join(BRAND, name);
  fs.writeFileSync(dest, svg.trim() + "\n");
  console.log("wrote " + path.relative(ROOT, dest));
}

const inner = emblemInner();
const defsBlock = emblemDefs();

write("icon-full.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
${defsBlock}
  <rect width="1024" height="1024" fill="#2a0c12"/>
${inner}
</svg>`);

write("icon-foreground.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
${defsBlock}
  <g transform="translate(194.56 194.56) scale(0.62)">
${inner}
  </g>
</svg>`);

write("icon-background.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="field" cx="34%" cy="26%" r="78%">
      <stop offset="0%" stop-color="#6b1c28"/>
      <stop offset="100%" stop-color="#16070a"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#field)"/>
</svg>`);

write("splash-icon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
${defsBlock}
  <rect width="1024" height="1024" fill="#2a0c12"/>
  <g transform="translate(266.24 266.24) scale(0.48)">
${inner}
  </g>
</svg>`);

write("splash.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">
${defsBlock}
  <rect width="2732" height="2732" fill="#2a0c12"/>
  <g transform="translate(854 700) scale(1)">
${inner}
  </g>
</svg>`);

write("feature-graphic.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500">
${defsBlock}
  <rect width="1024" height="500" fill="#2a0c12"/>
  <g transform="translate(48 58) scale(0.375)">
${inner}
  </g>
  <g fill="#edd089">
    <text x="470" y="228" font-family="Times New Roman, serif" font-size="64" letter-spacing="14" font-weight="500">LATRVNCVLI</text>
    <text x="470" y="286" font-family="Times New Roman, serif" font-size="22" letter-spacing="6" fill="#e8cc6a" opacity="0.92">LVDVS LATRVNCULORVM</text>
    <text x="470" y="338" font-family="Times New Roman, serif" font-size="20" letter-spacing="3" fill="#f3ead6" opacity="0.78">El juego de los latrones</text>
  </g>
  <rect x="0" y="0" width="1024" height="8" fill="#4a1420"/>
  <rect x="0" y="492" width="1024" height="8" fill="#4a1420"/>
  <rect x="0" y="8" width="1024" height="3" fill="#c9a227"/>
  <rect x="0" y="489" width="1024" height="3" fill="#c9a227"/>
</svg>`);

write("boot-tile.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
${defsBlock}
${inner}
</svg>`);

const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="field" cx="36%" cy="28%" r="78%">
      <stop offset="0%" stop-color="#7a2430"/>
      <stop offset="100%" stop-color="#16070a"/>
    </radialGradient>
    <linearGradient id="gold" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fff4c4"/>
      <stop offset="45%" stop-color="#e8cc6a"/>
      <stop offset="100%" stop-color="#8f6c1c"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="31" fill="url(#field)"/>
  <circle cx="32" cy="32" r="28.2" fill="none" stroke="url(#gold)" stroke-width="2.4"/>
  <circle cx="32" cy="32" r="25.4" fill="none" stroke="#e8cc6a" stroke-width="0.7" opacity="0.55"/>
  <g fill="none" stroke="url(#gold)" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30.6 44.2 C22.2 41.2 21.4 32.4 26.2 26.2"/>
    <path d="M33.4 44.2 C41.8 41.2 42.6 32.4 37.8 26.2"/>
    <path d="M29.6 44.4h4.8"/>
  </g>
  <g fill="url(#gold)">
    <path d="M26.4 42.4c-2.7.2-4-1.6-2.9-3.4 1.5.6 2.9 1.8 2.9 3.4z"/>
    <path d="M24.4 38c-2.7-.2-3.6-2.2-2.1-3.6 1.3 1 2.4 2.3 2.1 3.6z"/>
    <path d="M23.6 33.4c-2.6-.6-3.1-2.6-1.3-3.8 1.1 1.2 2.1 2.6 1.3 3.8z"/>
    <path d="M25.2 29.2c-2.3-1.3-2.1-3.3-.2-4 .6 1.4 1.4 2.9.2 4z"/>
    <path d="M28.6 26.2c-1.6-2.1-.6-3.8 1.3-3.9.2 1.5.4 2.9-1.3 3.9z"/>
    <path d="M37.6 42.4c2.7.2 4-1.6 2.9-3.4-1.5.6-2.9 1.8-2.9 3.4z"/>
    <path d="M39.6 38c2.7-.2 3.6-2.2 2.1-3.6-1.3 1-2.4 2.3-2.1 3.6z"/>
    <path d="M40.4 33.4c2.6-.6 3.1-2.6 1.3-3.8-1.1 1.2-2.1 2.6-1.3 3.8z"/>
    <path d="M38.8 29.2c2.3-1.3 2.1-3.3.2-4-.6 1.4-1.4 2.9-.2 4z"/>
    <path d="M35.4 26.2c1.6-2.1.6-3.8-1.3-3.9-.2 1.5-.4 2.9 1.3 3.9z"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(ROOT, "favicon.svg"), fav.trim() + "\n");
console.log("wrote favicon.svg");

function prefixIds(svg) {
  return svg
    .replace(/id="goldDeep"/g, 'id="bootGoldDeep"')
    .replace(/url\(#goldDeep\)/g, "url(#bootGoldDeep)")
    .replace(/id="gold"/g, 'id="bootGold"')
    .replace(/url\(#gold\)/g, "url(#bootGold)")
    .replace(/id="field"/g, 'id="bootField"')
    .replace(/url\(#field\)/g, "url(#bootField)")
    .replace(/id="leaf"/g, 'id="bootLeaf"')
    .replace(/url\(#leaf\)/g, "url(#bootLeaf)")
    .replace(/id="berry"/g, 'id="bootBerry"')
    .replace(/url\(#berry\)/g, "url(#bootBerry)");
}

function patchBootTile(file) {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  const bootInner = prefixIds(fs.readFileSync(path.join(BRAND, "boot-tile.svg"), "utf8").trim());
  const patched = html.replace(
    /<div class="boot-tile">[\s\S]*?<\/svg>\s*<\/div>/,
    `<div class="boot-tile">\n        ${bootInner}\n      </div>`
  );
  if (patched === html) {
    console.warn("no boot-tile in " + path.relative(ROOT, file));
    return;
  }
  fs.writeFileSync(file, patched);
  console.log("updated " + path.relative(ROOT, file) + " boot-tile");
}

patchBootTile(path.join(ROOT, "index.html"));
patchBootTile(path.join(ROOT, "sin-publicidad", "index.html"));
patchBootTile(path.join(ROOT, "netlify-deploy", "index.html"));

const netFav = path.join(ROOT, "netlify-deploy", "favicon.svg");
if (fs.existsSync(path.dirname(netFav))) {
  fs.writeFileSync(netFav, fav.trim() + "\n");
}
