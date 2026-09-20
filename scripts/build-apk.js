"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const KEYSTORE_DIR = path.join(ROOT, "keystore");
const JKS = path.join(KEYSTORE_DIR, "latrunculi-upload.jks");
const PROPS = path.join(KEYSTORE_DIR, "keystore.properties");
const DIST = path.join(ROOT, "dist");
const ANDROID = path.join(ROOT, "android");
const STUDIO_JBR = "C:\\Program Files\\Android\\Android Studio\\jbr";
const MS_JDK17 = "C:\\Program Files\\Microsoft\\jdk-17.0.20.8-hotspot";

function run(cmd, args, opts) {
  const quoted = /\s/.test(cmd) ? `"${cmd}"` : cmd;
  const r = spawnSync(quoted, args, {
    cwd: opts && opts.cwd ? opts.cwd : ROOT,
    stdio: "inherit",
    shell: true,
    env: opts && opts.env ? opts.env : process.env
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

function javaHome() {
  if (fs.existsSync(path.join(STUDIO_JBR, "bin", "java.exe"))) return STUDIO_JBR;
  if (process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, "bin", "java.exe"))) {
    return process.env.JAVA_HOME;
  }
  return MS_JDK17;
}

function ensureKeystore() {
  fs.mkdirSync(KEYSTORE_DIR, { recursive: true });
  if (!fs.existsSync(PROPS)) {
    const storePassword = "LatrunculiUpload2026!";
    fs.writeFileSync(
      PROPS,
      [
        "storeFile=../keystore/latrunculi-upload.jks",
        "storePassword=" + storePassword,
        "keyAlias=upload",
        "keyPassword=" + storePassword,
        ""
      ].join("\n")
    );
    fs.writeFileSync(
      path.join(KEYSTORE_DIR, "LEEME.txt"),
      [
        "ESTE KEYSTORE ES LA LLAVE DE LA PLAY STORE.",
        "Haz una copia de seguridad de latrunculi-upload.jks y de keystore.properties.",
        "Sin ellos no podrÃƒÂ¡s actualizar la app en Google Play.",
        "ContraseÃƒÂ±a: estÃƒÂ¡ en keystore.properties (storePassword / keyPassword).",
        "Alias: upload",
        ""
      ].join("\n")
    );
  }
  if (!fs.existsSync(JKS)) {
    const p = fs.readFileSync(PROPS, "utf8");
    const pass = (p.match(/storePassword=(.*)/) || [])[1].trim();
    const keytool = path.join(javaHome(), "bin", "keytool.exe");
    const kt = fs.existsSync(keytool) ? keytool : "keytool";
    run(kt, [
      "-genkeypair", "-v",
      "-keystore", '"' + JKS + '"',
      "-keyalg", "RSA",
      "-keysize", "2048",
      "-validity", "10000",
      "-alias", "upload",
      "-dname", '"CN=Ludus Latrunculorum, OU=Latrunculi, O=Ludus Latrunculorum, L=Roma, C=ES"',
      "-storepass", pass,
      "-keypass", pass
    ]);
  }
}

function envWithSdk() {
  const env = { ...process.env };
  const sdk = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA, "Android", "Sdk");
  env.ANDROID_HOME = sdk;
  env.ANDROID_SDK_ROOT = sdk;
  env.JAVA_HOME = javaHome();
  env.PATH = env.JAVA_HOME + "\\bin;" + (env.PATH || "");
  fs.writeFileSync(path.join(ANDROID, "local.properties"), "sdk.dir=" + sdk.replace(/\\/g, "\\\\") + "\n");
  return env;
}

function copyApk() {
  fs.mkdirSync(DIST, { recursive: true });
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const ver = pkg.version || "0.0.0";
  const apk = path.join(ANDROID, "app", "build", "outputs", "apk", "store", "release", "app-store-release.apk");
  const aab = path.join(ANDROID, "app", "build", "outputs", "bundle", "storeRelease", "app-store-release.aab");
  const APKS = path.join("C:", "Users", "carlo", "Desktop", "Proyectos", "Android", "APKs");
  const PLAY = path.join("C:", "Users", "carlo", "Desktop", "Proyectos", "Android", "PlayStore", "Latrunculi");
  if (fs.existsSync(apk)) {
    fs.copyFileSync(apk, path.join(DIST, "Latrunculi-" + ver + ".apk"));
    fs.mkdirSync(APKS, { recursive: true });
    fs.copyFileSync(apk, path.join(APKS, "Latrunculi-" + ver + "-con-publicidad.apk"));
  }
  if (fs.existsSync(aab)) {
    fs.copyFileSync(aab, path.join(DIST, "Latrunculi-" + ver + ".aab"));
    fs.mkdirSync(PLAY, { recursive: true });
    fs.copyFileSync(aab, path.join(PLAY, "Latrunculi-" + ver + ".aab"));
  }
  return ver;
}

function main() {
  ensureKeystore();
  run("npm", ["run", "prepare:android"]);
  if (!fs.existsSync(path.join(ANDROID, "app"))) {
    run("npx", ["cap", "add", "android"]);
  }
  run("npx", ["cap", "sync", "android"]);
  run("npm", ["run", "icons"]);
  const env = envWithSdk();
  const gradlew = path.join(ANDROID, "gradlew.bat");
  run(gradlew, ["assembleStoreRelease", "bundleStoreRelease", "--no-daemon"], { cwd: ANDROID, env });
  const ver = copyApk();
  console.log("APK: dist/Latrunculi-" + ver + ".apk");
  console.log("AAB: dist/Latrunculi-" + ver + ".aab");
}

main();

