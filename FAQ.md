# TabTune FAQ

[中文](#中文) · [English](#english)

<a id="中文"></a>

## 中文

### 为什么快捷键没有反应？

打开 `chrome://extensions/shortcuts`，找到 TabTune，确认快捷键已经设置，并且范围是 **Global**。如果仍然没有反应，检查它是否和其他扩展或操作系统快捷键冲突。

修改快捷键后，可以重新打开这个页面确认 Chrome 已经保存。

### 为什么切换到其他标签页或应用后不能使用？

快捷键必须设置为 **Global**。如果设置为 **In Chrome**，只有 Chrome 当前窗口可以使用；如果没有设置，快捷键不会触发。

### 为什么扩展图标是灰色的？

打开 `chrome://extensions` → TabTune → **Details**，在 **Site access** 中选择 **On all sites**，然后刷新音乐页面。Chrome 内部页面和 Chrome Web Store 页面不能被扩展控制。

### 为什么显示 “Can't read or change site's data”？

这表示当前页面还没有允许 TabTune 访问。请在扩展详情中的 **Site access** 开启 **On all sites**。如果页面是 `chrome://`、Chrome Web Store 或其他受保护页面，Chrome 不允许扩展访问。

### 为什么一直显示没有媒体或正在查找媒体？

先确认网页已经开始播放，并刷新页面。TabTune 需要看到页面中的 `<audio>`、`<video>` 或 Media Session 播放器。

如果网站使用了特殊的音频引擎，可能无法被自动识别。可以在音乐页面点击一次播放或暂停，再打开 TabTune 查看。

### 有多个音乐页面时，快捷键控制哪一个？

TabTune 默认控制最近一次操作过的媒体页面。想切换目标时，在另一个音乐页面点击一次播放、暂停或音量控件即可。

### 为什么播放/暂停可以用，但上一首或下一首没有效果？

上一首和下一首需要网站提供播放列表、合集、分 P，或 Media Session 的对应控制。普通网页播放器可能没有这些能力。

### 为什么下一首需要按两次？

网站切换歌曲时可能需要等待页面加载。如果网站没有报告歌曲或媒体来源发生变化，TabTune 会等待一小段时间并报告失败。请确认当前页面确实还有下一首，并重新设置为最近操作的目标页面。

### 为什么音量快捷键没有效果？

TabTune 调整的是网页播放器音量，不是系统总音量。某些网站使用自定义音频引擎，只有在页面提供可控制的音量滑块时才能调整。

### 为什么 Chrome 里有 “Activate extension”？

这是 Chrome 为带有工具栏图标的扩展提供的内置快捷键项目，不是 TabTune 的媒体控制命令，可以保持 **Not set**。

### 当前限制

- 目前提供的是 Chrome 的未打包扩展，需要使用 **Load unpacked** 安装。
- 只处理普通窗口中的 HTTP/HTTPS 网页媒体。
- 不修改系统总音量。
- 不控制 Chrome 内部页面、其他浏览器或其他 Chrome 用户配置。
- 网站页面结构变化，可能会影响上一首／下一首控制。
- 全局快捷键还可能受到操作系统和桌面环境的快捷键冲突影响。

### 如何更新扩展？

在项目目录运行：

```sh
npm run build
```

然后打开 `chrome://extensions`，在 TabTune 卡片上点击刷新按钮。正在播放的网页也建议刷新一次。

<a id="english"></a>

## English

### Why do my shortcuts do nothing?

Open `chrome://extensions/shortcuts`, find TabTune, and make sure a shortcut is assigned with the scope set to **Global**. If it still does nothing, check for conflicts with another extension or an operating system shortcut.

Reopen the shortcuts page after editing to confirm that Chrome saved the change.

### Why does it stop working when I switch tabs or apps?

The shortcut must use the **Global** scope. **In Chrome** only works in the current Chrome window, and **Not set** means that no shortcut is assigned.

### Why is the extension icon gray?

Open `chrome://extensions` → TabTune → **Details**. Under **Site access**, choose **On all sites**, then refresh the music page. Chrome internal pages and the Chrome Web Store cannot be controlled by extensions.

### Why do I see “Can't read or change site's data”?

The current page has not granted TabTune access. Open the extension details and enable **On all sites** under **Site access**. Chrome does not allow extensions to access `chrome://` pages, the Chrome Web Store, or some protected pages.

### Why does TabTune keep looking for media?

Make sure the page has started playback and refresh it. TabTune looks for an `<audio>`, `<video>`, or Media Session player on the page.

Some sites use a custom audio engine that cannot be detected automatically. Try clicking play or pause once on the music page, then open TabTune again.

### Which tab is controlled when several tabs play audio?

TabTune controls the media page you interacted with most recently. To switch targets, click play, pause, or a volume control once on another music page.

### Why do play/pause controls work while previous/next does not?

Previous and next require a playlist, collection, multi-part video, or matching Media Session actions from the website. A simple web player may not provide them.

### Why do I need to press Next twice?

A site may need time to load the next song. If it does not report a media or track change, TabTune waits briefly and reports a failure. Check that a next track exists and interact with the page again to make it the current target.

### Why do volume shortcuts have no effect?

TabTune changes the web player's volume, not the system master volume. Some sites use custom audio engines and can only be adjusted when they expose a controllable volume slider.

### Why is there an “Activate extension” entry in Chrome?

Chrome adds this built-in shortcut entry for extensions with a toolbar icon. It is not a TabTune media command and can stay **Not set**.

### Current limitations

- This is currently an unpacked Chrome extension loaded with **Load unpacked**.
- It handles media in regular HTTP/HTTPS pages in normal browser windows.
- It does not change the operating system's master volume.
- It cannot control Chrome internal pages, other browsers, or another Chrome profile.
- Website layout changes may affect previous/next track controls.
- Operating system and desktop shortcut conflicts can affect Global shortcuts.

### How do I update the extension?

Run this in the project directory:

```sh
npm run build
```

Then open `chrome://extensions` and click the refresh button on the TabTune card. Refresh the playing page as well if needed.
