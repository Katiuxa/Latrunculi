"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8790;
const ROOT = path.join(__dirname, "..", "www");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const file = path.normalize(path.join(ROOT, urlPath.replace(/^\/+/, "")));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
      res.end(buf);
    });
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log("READY http://127.0.0.1:" + PORT + "/");
  });
