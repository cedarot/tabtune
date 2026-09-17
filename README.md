# TabTune

[简体中文](README_ZH.md) · English

## English

TabTune is a Chrome extension for controlling music and video playing in browser tabs.

You can leave YouTube, Bilibili, or another music site in the background and use shortcuts from your editor, another tab, or another app to:

- play or pause
- go to the previous or next track
- increase or decrease the web player volume
- seek forward or backward by 10 seconds

TabTune runs locally. It does not upload page URLs, song information, or playback history.

### Supported websites

TabTune does not use a fixed website allowlist. It can work on any regular HTTP/HTTPS page that exposes a standard HTML5 `<audio>` or `<video>` element, or the browser Media Session controls.

| Website or player type | Support |
| --- | --- |
| YouTube | Play/pause, volume, seek, and previous/next when the video has them |
| Bilibili | Play/pause, volume, seek, and previous/next when the video has them |
| Other HTML5 or Media Session players | The same basic controls; previous/next depends on the site |
| Self-hosted or custom players, such as Feiniu Music | Works when the page exposes a standard media element, Media Session, or a controllable volume slider |

The list is a guide rather than a guarantee. A website can change its player or page structure at any time.

### First-time setup

1. Install [Node.js 18 or newer](https://nodejs.org/).
2. Download the project and enter its directory:

   ```sh
   git clone https://github.com/cedarot/tabtune.git
   cd tabtune
   ```

   If you already downloaded the project, just open a terminal in its directory.
3. Install dependencies:

   ```sh
   npm ci
   ```

   If you see `tsc: command not found`, this step probably did not complete successfully.
4. Build the extension:

   ```sh
   npm run build
   ```

   This creates a `dist/` folder. Chrome loads this folder.
5. Open `chrome://extensions` in Chrome, turn on **Developer mode**, click **Load unpacked**, and select the project's `dist/` folder.

   After changing the code, run `npm run build` again and click the refresh button on the extensions page.

   During installation, Chrome asks TabTune to access HTTP and HTTPS pages. Allowing this is required to discover and control players on different websites.

### Set up shortcuts

Chrome manages extension shortcuts on its own settings page:

1. Open `chrome://extensions/shortcuts`.
2. Find **TabTune**.
3. Enter a shortcut for each command you want to use.
4. Set the scope to **Global**.

The current commands are:

| Action | Default shortcut |
| --- | --- |
| Play/Pause | `Ctrl+Shift+7` |
| Previous track | `Ctrl+Shift+8` |
| Next track | `Ctrl+Shift+9` |
| Increase volume | Not set |
| Decrease volume | Not set |
| Seek forward | Not set |
| Seek backward | Not set |

On macOS, use the matching `Command` combination. Chrome may also show a built-in **Activate extension** entry; it is not a TabTune media command and can remain unset.

### Frequently asked questions

See [FAQ.md](FAQ.md) for answers about shortcuts, permissions, media detection, volume, and previous/next track controls.
