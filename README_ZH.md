# TabTune

[English](README.md) · 中文

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

### 常见问题

常见问题请查看 [FAQ.md](FAQ.md)。里面包含快捷键、权限、媒体识别、音量和上一首／下一首等问题的处理方法。
