# TabTune

Global keyboard controls for media playing across Chrome tabs.

TabTune is currently distributed as an unpacked Manifest V3 Chrome extension. The build produces JavaScript, the manifest, popup assets, and source maps in `dist/`; it does not produce a CRX or Chrome Web Store package yet.

## Build

Requirements: Node.js 18+ and npm.

```sh
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
```

`npm run build` compiles the TypeScript sources, bundles the background service worker and UI/content entry points into browser-loadable files, and copies the static extension assets to `dist/`. The `dist/` directory is ignored by Git and can be regenerated at any time.

## Install for local use

1. Run `npm run build`.
2. Open `chrome://extensions` in Chrome, enable Developer mode, and click **Load unpacked**.
3. Select the repository's `dist/` directory.
4. Open any HTTP or HTTPS page with an HTML audio/video player. Click TabTune's **Allow control of web media** button when permission is requested.
5. Open the TabTune popup and choose **Open Chrome shortcut settings**, or open `chrome://extensions/shortcuts` directly. Every control has its own command; four have suggested global shortcuts and the other four are available to bind manually.
6. Set each command to the **Global** scope. TabTune remembers the most recently interacted with media tab and sends commands to that tab, including when it is paused.

The first permission button currently requests HTTP and HTTPS host access so TabTune can discover and control authorized pages. The extension keeps state locally and does not upload media metadata.

## Controls

The default suggested global shortcuts are `Ctrl+Shift+7` for Play, `Ctrl+Shift+8` for Pause, `Ctrl+Shift+9` for Previous track, and `Ctrl+Shift+0` for Next track. macOS uses the corresponding Command shortcuts. All eight commands can be rebound in Chrome's shortcut settings.

TabTune detects HTML audio/video elements on any authorized HTTP/HTTPS page, including players that create detached `new Audio()` elements. Play, pause, volume, and seek use the media element directly. Previous/next uses Media Session handlers or matching player controls (including common ARIA labels) when the page exposes them; it does not depend on the site's domain.

This repository is being developed from [REQ-001](https://github.com/cedarot/tabtune/issues/1). Real-site and OS-level shortcut verification is tracked in [`docs/verification.md`](docs/verification.md).
