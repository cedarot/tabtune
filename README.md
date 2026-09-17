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

### Choose the media tab to control

TabTune remembers the media tab you interacted with most recently.

For example:

1. Click play, pause, or a volume control on a music page.
2. Switch to your editor, another tab, or another app.
3. Press a TabTune Global shortcut.

The shortcut keeps controlling the page you just used. TabTune keeps the target after pausing. To switch between multiple music pages, interact with the page you want to control once.

### If the icon is gray

If Chrome shows **Can't read or change site's data**:

1. Open `chrome://extensions`.
2. Click TabTune **Details**.
3. Under **Site access**, choose **On all sites**.
4. Refresh the music page.

Chrome internal pages such as `chrome://extensions`, the Chrome Web Store, and some protected pages cannot be controlled by extensions. This is a browser restriction.

### Frequently asked questions

See [FAQ.md](FAQ.md) for answers about shortcuts, permissions, media detection, volume, and previous/next track controls.
