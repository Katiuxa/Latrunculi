# Latrunculi

Ludus Latrunculorum. Web and Android live in the same repo, in separate folders.

## Web

https://latrunculigame.vercel.app

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
