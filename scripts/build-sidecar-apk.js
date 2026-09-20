"use strict";

/**
 * Builds a side-by-side test APK (applicationId …lautrunculi.v2)
 * that installs next to the Play Store app without replacing it.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const ANDROID = path.join(ROOT, "android");
const APKS = path.join("C:", "Users", "carlo", "Desktop", "Proyectos", "Android", "APKs");
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

function main() {
  run("npm", ["run", "prepare:android"]);
  run("npx", ["cap", "sync", "android"]);
  const env = envWithSdk();
  const gradlew = path.join(ANDROID, "gradlew.bat");
  run(gradlew, ["assembleSidecarRelease", "--no-daemon"], { cwd: ANDROID, env });

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const ver = pkg.version || "0.0.0";
  const apk = path.join(
    ANDROID,
    "app",
    "build",
    "outputs",
    "apk",
    "sidecar",
    "release",
    "app-sidecar-release.apk"
  );
  if (!fs.existsSync(apk)) {
    console.error("Sidecar APK not found:", apk);
    process.exit(1);
  }

  fs.mkdirSync(DIST, { recursive: true });
  fs.mkdirSync(APKS, { recursive: true });
  const name = "Latrunculi-" + ver + "-v2-sidecar.apk";
  fs.copyFileSync(apk, path.join(DIST, name));
  fs.copyFileSync(apk, path.join(APKS, name));
  console.log("Package: com.metamovidas.lautrunculi.v2");
  console.log("Launcher: LATRVNCVLI V2");
  console.log("APK: dist/" + name);
  console.log("Copy: " + path.join(APKS, name));
}

main();
