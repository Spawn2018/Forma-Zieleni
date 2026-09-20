# HOTFIX 0.2.1 — blank screen after APK install

**Date:** 2026-09-19 (Europe/Warsaw)  
**Symptom:** White/blank WebView after install. Chrome/WebView log: `ERR_NAME_NOT_RESOLVED` for `appassets.androidplatform.net` (rebuilds that pointed at AssetLoader without native wiring), **or** silent failure of Vite `type="module"` under `file:///android_asset` (shipped 0.2.0 APK).

## Root cause

1. **Wrong URI (later builds / source):** WebView loaded `https://appassets.androidplatform.net/assets/www/index.html` without a native `WebViewAssetLoader` → DNS fail → blank screen.
2. **ES modules on file:// (shipped 0.2.0 APK):** Bundle already used `file:///android_asset/www/index.html`, but `index.html` had `<script type="module">`. Android WebView blocks module scripts on `file://` (CORS) → blank screen.

## Fix (0.2.1)

| Area | Change |
|------|--------|
| WebView URI | `file:///android_asset/www/index.html` (+ `allowFileAccess*`) |
| Vite `build:native` | `VITE_NATIVE=true`, `base: './'`, **IIFE** classic script + **`defer`** (no `type="module"`) |
| Router | `HashRouter` when native / `file:` / asset paths |
| PhoneFrame | Full-bleed + safe-area on device |
| Persist | `fz-mobile-v8` (migrates v4–v7) |
| Version | **0.2.1** |

## APK for Sebastian (reinstall)

**File:** `/workspace/formazieleni/mobile-expo/docs/formazieleni-makieta-0.2.1.apk`  
(also copied to `/workspace/formazieleni/docs/formazieleni-makieta-0.2.1.apk`)

> Signed with a **debug** keystore for this hotfix. You **must uninstall** the previous Play/EAS-signed 0.2.0 first (signature mismatch), then install 0.2.1.

### Steps

1. Android → Settings → Apps → **Forma Zieleni** → **Uninstall**
2. Enable install from unknown sources for your Files app
3. Install `formazieleni-makieta-0.2.1.apk`
4. Open app → login screen (not blank). Demo: pick an account → “Otwórz link”

## Rebuild (EAS — release signature)

```bash
cd /workspace/formazieleni/mobile-expo
npm run sync:makieta
# requires: eas login / EXPO_TOKEN
npx eas-cli@latest build --platform android --profile preview --non-interactive
```

## Verify locally

```bash
cd /workspace/formazieleni/mobile-app
npm run build          # browser ESM
npm run build:native   # IIFE for WebView
# Dev mock:
npm run dev            # http://127.0.0.1:8790/  and  /dev
```

Checklist before shipping:

- [x] `assets/www/index.html` → `<script defer src="./assets/app.js">` (no `type="module"`)
- [x] WebView URI → `file:///android_asset/www/…`
- [x] No `appassets.androidplatform.net` load path
- [x] `npm run build` + `npm run build:native` pass
