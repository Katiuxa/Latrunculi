"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const WWW = path.join(ROOT, "www");
const FONT_DIR = path.join(WWW, "fonts");
const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;900&family=Cinzel+Decorative:wght@700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap";

function fetchBuffer(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: headers || {} }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchBuffer(res.headers.location, headers).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error("HTTP " + res.statusCode + " " + url));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function prepareFonts() {
  ensureDir(FONT_DIR);
  const cssPath = path.join(WWW, "fonts.css");
  if (fs.existsSync(cssPath) && fs.readdirSync(FONT_DIR).length >= 3) return;
  const css = (await fetchBuffer(CSS_URL, {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
  })).toString("utf8");
  const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((m) => m[1]))];
  let localCss = css;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const ext = (url.split(".").pop() || "woff2").split("?")[0];
    const name = "f" + i + "." + ext;
    const dest = path.join(FONT_DIR, name);
    if (!fs.existsSync(dest)) {
      const buf = await fetchBuffer(url, {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
      });
      fs.writeFileSync(dest, buf);
    }
    localCss = localCss.split(url).join("fonts/" + name);
  }
  fs.writeFileSync(cssPath, localCss);
}

function patchHtml(html) {
  html = html.replace('<html lang="es">', '<html lang="es" class="android-app is-native">');
  html = html.replace(
    /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin \/>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet" \/>/,
    '<link rel="stylesheet" href="fonts.css" />\n  <link rel="stylesheet" href="android.css" />'
  );
  if (!html.includes("android.css")) {
    html = html.replace("</title>", '</title>\n  <link rel="stylesheet" href="fonts.css" />\n  <link rel="stylesheet" href="android.css" />');
  }
  if (!html.includes("src=\"bridge.js\"")) {
    html = html.replace("</body>", '  <script src="bridge.js"></script>\n</body>');
  }
  html = html.replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />'
  );
  return html;
}

async function main() {
  ensureDir(WWW);
  const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  fs.writeFileSync(path.join(WWW, "index.html"), patchHtml(src));
  for (const f of ["favicon.svg", "manifest.webmanifest"]) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) fs.copyFileSync(p, path.join(WWW, f));
  }
  fs.copyFileSync(path.join(ROOT, "native", "bridge.js"), path.join(WWW, "bridge.js"));
  fs.copyFileSync(path.join(ROOT, "native", "android.css"), path.join(WWW, "android.css"));
  await prepareFonts();
  console.log("www listo");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
