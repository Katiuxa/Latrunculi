# Latrunculi

Ludus Latrunculorum. Web + app Android (Capacitor).

**Jugar:** https://katiuxa.github.io/Latrunculi/

La barra de navegación de Android tapaba botones. Se resolvió con `WindowInsets` en `MainActivity` (padding inferior nativo). CSS `safe-area` solo no bastaba.

```bash
# web
node server.js
# android
npm ci
npm run apk
```

Keystore de Play Store fuera de git.
