# TabTune

[中文](#中文) · [English](#english)

<a id="中文"></a>

## 中文

TabTune 是一个 Chrome 扩展，用来控制正在播放音乐或视频的网页。

你可以把 YouTube、Bilibili 或其他音乐网站放在后台，然后在编辑器或其他应用中使用快捷键来：

- 播放或暂停
- 上一首、下一首
- 增大或减小网页播放器音量
- 快进或快退 10 秒

TabTune 只在本地运行，不会上传网页地址、歌曲信息或播放记录。

### 第一次使用

1. 安装 [Node.js 18 或更新版本](https://nodejs.org/)。
2. 下载项目并进入项目目录：

   ```sh
   git clone https://github.com/cedarot/tabtune.git
   cd tabtune
   ```

   如果项目已经下载到本地，只需要进入它所在的目录即可。
3. 安装依赖：

   ```sh
   npm ci
   ```

   如果看到 `tsc: command not found`，通常是因为这一步没有成功执行。
4. 编译扩展：

   ```sh
   npm run build
   ```

   编译完成后会生成 `dist/` 文件夹，Chrome 要加载的就是这个文件夹。
5. 在 Chrome 中打开 `chrome://extensions`，打开右上角的 **Developer mode**，点击 **Load unpacked**，选择项目里的 `dist/` 文件夹。

   修改代码后，重新运行 `npm run build`，再回到扩展页面点击刷新按钮。

   首次安装时，Chrome 会请求 TabTune 访问 HTTP 和 HTTPS 网页。允许后，它才能发现和控制不同网站中的播放器。

### 设置快捷键

Chrome 扩展的全局快捷键需要在 Chrome 自己的页面中设置：

1. 打开 `chrome://extensions/shortcuts`。
2. 找到 **TabTune**。
3. 为需要的操作输入快捷键。
4. 将范围设置为 **Global**。

当前命令如下：

| 操作 | 默认快捷键 |
| --- | --- |
| Play/Pause | `Ctrl+Shift+7` |
| Previous track | `Ctrl+Shift+8` |
| Next track | `Ctrl+Shift+9` |
| Increase volume | 未设置 |
| Decrease volume | 未设置 |
| Seek forward | 未设置 |
| Seek backward | 未设置 |

macOS 会使用对应的 `Command` 组合键。Chrome 可能会显示一个叫 **Activate extension** 的内置项目；它不是 TabTune 的媒体控制命令，可以保持未设置。

### 怎么选择控制目标

TabTune 会记住最近一次明确操作过的媒体标签页。

例如：

1. 在音乐页面点击一次播放、暂停或音量控件。
2. 切换到编辑器、其他标签页或其他应用。
3. 按 TabTune 的全局快捷键。

快捷键会继续控制刚才操作的页面。暂停后，TabTune 仍然会保留这个目标。如果有多个音乐页面，在想控制的页面上操作一次即可切换目标。

### 图标是灰色怎么办

如果 Chrome 显示 **Can't read or change site's data**：

1. 打开 `chrome://extensions`。
2. 点击 TabTune 的 **Details**。
3. 在 **Site access** 中选择 **On all sites**。
4. 刷新音乐网页。

Chrome 内部页面（例如 `chrome://extensions`）、Chrome Web Store 页面和部分受保护页面不能被扩展控制，这是浏览器的限制。

### 常见问题

常见问题请查看 [FAQ.md](FAQ.md)。里面包含快捷键、权限、媒体识别、音量和上一首／下一首等问题的处理方法。

### 开发者命令

```sh
npm ci                 # 安装依赖
npm run lint           # 检查代码格式
npm run typecheck      # 检查 TypeScript 类型
npm run test:unit      # 运行单元测试
npm run test:e2e       # 运行 E2E 测试
npm run build          # 构建可加载的扩展
```

### 当前限制

- 目前提供的是 Chrome 的未打包扩展，需要使用 **Load unpacked** 安装。
- 只处理普通窗口中的 HTTP/HTTPS 网页媒体。
- 不修改系统总音量。
- 不控制 Chrome 内部页面、其他浏览器或其他 Chrome 用户配置。
- 网站页面结构变化，可能会影响上一首／下一首控制。
- 全局快捷键还可能受到操作系统和桌面环境的快捷键冲突影响。

### 项目目录

```text
src/manifest.json          Chrome 扩展配置
src/background/            后台服务和目标标签页管理
src/content/               网页媒体检测和控制
src/options/               设置页面
src/popup/                 扩展图标弹窗
src/icons/                 TabTune 图标
src/shared/                类型和消息定义
tests/                     自动化测试
```

<a id="english"></a>

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

### Developer commands

```sh
npm ci                 # install dependencies
npm run lint           # check formatting and lint rules
npm run typecheck      # check TypeScript types
npm run test:unit      # run unit tests
npm run test:e2e       # run E2E tests
npm run build          # build the unpacked extension
```

### Current limitations

- This is currently an unpacked Chrome extension loaded with **Load unpacked**.
- It handles media in regular HTTP/HTTPS pages in normal browser windows.
- It does not change the operating system's master volume.
- It cannot control Chrome internal pages, other browsers, or another Chrome profile.
- Website layout changes may affect previous/next track controls.
- Operating system and desktop shortcut conflicts can affect Global shortcuts.

### Project layout

```text
src/manifest.json          Chrome extension manifest
src/background/            service worker and media target management
src/content/               media detection and page controls
src/options/               settings page
src/popup/                 extension popup
src/icons/                 TabTune icons
src/shared/                shared types and messages
tests/                     automated tests
```
