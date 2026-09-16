const descriptions: Record<string, string> = {
  play: '播放', pause: '暂停', 'toggle-playback': '播放／暂停', 'next-track': '下一项', 'previous-track': '上一项',
  'volume-up': '音量增加', 'volume-down': '音量减少', 'seek-forward': '快进', 'seek-backward': '快退'
};

const container = document.querySelector<HTMLDivElement>('#commands')!;
const permissionButton = document.querySelector<HTMLButtonElement>('#permission')!;
const permissionStatus = document.querySelector<HTMLParagraphElement>('#permission-status')!;
const origins = ['http://*/*', 'https://*/*'];
function openSettings(): void { void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); }
function render(commands: chrome.commands.Command[]): void {
  container.replaceChildren();
  for (const command of commands.filter((item) => item.name && item.name !== '_execute_action')) {
    const row = document.createElement('div'); row.className = 'command';
    const name = document.createElement('div'); name.className = 'name';
    const label = document.createElement('div'); label.className = 'description'; label.textContent = descriptions[command.name ?? ''] ?? command.description ?? command.name ?? '未命名命令';
    const id = document.createElement('div'); id.className = 'id'; id.textContent = command.name ?? '';
    name.append(label, id);
    const shortcut = document.createElement('div'); shortcut.className = `shortcut${command.shortcut ? '' : ' unset'}`; shortcut.textContent = command.shortcut || '未设置';
    const configure = document.createElement('button'); configure.textContent = '设置'; configure.ariaLabel = `设置${label.textContent}快捷键`; configure.onclick = openSettings;
    row.append(name, shortcut, configure); container.append(row);
  }
}
async function load(): Promise<void> { render(await chrome.commands.getAll()); }
async function loadPermission(): Promise<void> {
  const granted = await chrome.permissions.contains({ origins });
  permissionButton.disabled = granted;
  permissionButton.textContent = granted ? '网页访问已允许' : '允许控制网页媒体';
  permissionStatus.textContent = granted ? 'TabTune 可以注入控制脚本并发现网页媒体。' : '需要允许 HTTP 和 HTTPS 网页访问，才能控制任意网页中的音频和视频。';
}
permissionButton.onclick = () => {
  void chrome.permissions.request({ origins })
    .then(async (granted) => {
      if (!granted) { permissionStatus.textContent = 'Chrome 未授予网页访问权限。'; return; }
      permissionStatus.textContent = '网页访问已允许，正在刷新媒体标签页…';
      await chrome.runtime.sendMessage({ type: 'REFRESH' });
      await loadPermission();
    })
    .catch((error: unknown) => { permissionStatus.textContent = error instanceof Error ? `Chrome 无法授予权限：${error.message}` : 'Chrome 无法授予网页访问权限。'; });
};
document.querySelector<HTMLButtonElement>('#open')!.onclick = openSettings;
void Promise.all([load(), loadPermission()]);
