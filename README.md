# TabTune

TabTune 是一个 Chrome 扩展，用来控制正在播放音乐或视频的网页。

例如，你可以把 YouTube、Bilibili 或其他音乐网站放在后台，然后在编辑器或其他应用中使用快捷键来：

- 播放或暂停
- 上一首、下一首
- 增大或减小音量
- 快进或快退 10 秒

TabTune 只在本地运行，不会上传网页地址、歌曲信息或播放记录。

## 第一次使用

### 1. 安装 Node.js

需要 Node.js 18 或更新版本。安装后，在项目目录打开终端：

```sh
cd /home/anolis/project/github/tabtune
```

### 2. 安装项目依赖

```sh
npm ci
```

如果之前看到 `tsc: command not found`，通常就是这一步没有执行成功。

### 3. 编译扩展

```sh
npm run build
```

编译完成后，会生成一个 `dist/` 文件夹。Chrome 要加载的就是这个文件夹。

### 4. 在 Chrome 中加载

1. 在地址栏打开 `chrome://extensions`。
2. 打开右上角的 **Developer mode**。
3. 点击 **Load unpacked**。
4. 选择项目里的 `dist/` 文件夹。

更新代码后，重新运行 `npm run build`，然后回到扩展页面点击刷新按钮。

首次安装时，Chrome 会请求 TabTune 访问 HTTP 和 HTTPS 网页。这是为了让它能够发现和控制不同网站中的播放器。

## 设置快捷键

Chrome 扩展的全局快捷键必须在 Chrome 自己的设置页面中配置：

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

macOS 会使用对应的 `Command` 组合键。建议把快捷键设置为 Global，这样切换到其他标签页或其他应用后也能使用。

Chrome 可能会显示一个叫 **Activate extension** 的内置项目。它不是 TabTune 的媒体控制命令，可以保持未设置。

## 怎么选择控制目标

TabTune 会记住最近一次明确操作过的媒体标签页。

例如：

1. 在 YouTube 点击一次播放按钮。
2. 切换到编辑器。
3. 按 TabTune 的快捷键。

快捷键会继续控制刚才操作的 YouTube 页面。暂停后，TabTune 仍然会保留这个目标。

如果有多个音乐页面，先在你想控制的页面上点击一次播放、暂停或音量控件，可以让 TabTune 记住这个页面。

## 图标是灰色怎么办

如果 Chrome 显示：

> Can't read or change site's data

通常表示当前页面不允许扩展访问。可以检查：

1. 打开 `chrome://extensions`。
2. 点击 TabTune 的 **Details**。
3. 在 **Site access** 中选择 **On all sites**。
4. 刷新音乐网页。

Chrome 内部页面（例如 `chrome://extensions`）、Chrome Web Store 页面和部分受保护页面不能被扩展控制，这是浏览器的限制。

## 常见问题

### 快捷键没有反应

- 确认快捷键范围是 **Global**。
- 确认没有和其他扩展或操作系统快捷键冲突。
- 确认音乐页面已经加载完成并且允许 TabTune 访问。
- 修改快捷键后重新打开 `chrome://extensions/shortcuts` 检查是否保存。
- 修改代码后重新执行 `npm run build` 并刷新扩展。

### 下一首或上一首没有效果

网站必须提供播放列表、合集、分 P，或者提供 Media Session 的上一首／下一首控制。普通网页播放器通常只能播放、暂停、调音量和调整进度。

### 音量快捷键没有效果

TabTune 修改的是网页播放器自己的音量，不会修改系统总音量。某些网站使用自定义音频引擎，可能需要页面提供音量滑块才能控制。

## 开发者命令

安装依赖：

```sh
npm ci
```

检查代码格式和类型：

```sh
npm run lint
npm run typecheck
```

运行测试：

```sh
npm run test:unit
npm run test:e2e
```

完整构建：

```sh
npm run build
```

## 当前限制

- 目前提供的是 Chrome 的未打包扩展，需要使用 **Load unpacked** 安装。
- 只处理普通窗口中的 HTTP/HTTPS 网页媒体。
- 不修改系统总音量。
- 不控制 Chrome 内部页面、其他浏览器或其他 Chrome 用户配置。
- YouTube、Bilibili 和其他网站的页面结构变化，可能会影响上一首／下一首控制。
- Windows、macOS、Linux 的全局快捷键是否可用，还受到操作系统和桌面环境的快捷键冲突影响。

## 项目目录

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

如果只是想使用 TabTune，通常只需要执行 `npm ci`、`npm run build`，然后在 Chrome 中加载 `dist/`。
