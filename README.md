# Latrunculi

Ludus Latrunculorum. Web y Android en el mismo repo, en carpetas distintas.

## Web

https://katiuxa.github.io/Latrunculi/

Código en `docs/`. Esa carpeta es también el publish de Netlify.

```bash
node server.js
```

## Android

Capacitor. Versión **1.0.89**. Código nativo en `android/`. El HTML de la app se genera con `npm run prepare:android` (no uses `docs/` para el APK).

```bash
npm ci
npm run apk
```

Keystore de Play Store fuera de git.

La barra de navegación de Android se reserva con insets nativos en `MainActivity`.
