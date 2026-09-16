const descriptions: Record<string, string> = {
  play: '播放', pause: '暂停', 'toggle-playback': '播放／暂停', 'next-track': '下一项', 'previous-track': '上一项',
  'volume-up': '音量增加', 'volume-down': '音量减少', 'seek-forward': '快进', 'seek-backward': '快退'
};

const container = document.querySelector<HTMLDivElement>('#commands')!;
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
document.querySelector<HTMLButtonElement>('#open')!.onclick = openSettings;
void load();
