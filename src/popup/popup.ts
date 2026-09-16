import { shortcutActions, shortcutLabels } from '../shared/shortcuts';

const $ = <T extends HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
const container = $<HTMLElement>('#shortcuts');
const status = $<HTMLParagraphElement>('#status');
const permissionButton = $<HTMLButtonElement>('#permission');
const permissionStatus = $<HTMLParagraphElement>('#permission-status');
const origins = ['http://*/*', 'https://*/*'];

function render(commands: chrome.commands.Command[]): void {
  const values = new Map(commands.map((command) => [command.name, command.shortcut]));
  container.replaceChildren();
  for (const action of shortcutActions) {
    const row = document.createElement('div'); row.className = 'shortcut-row';
    const name = document.createElement('span'); name.className = 'shortcut-name'; name.textContent = shortcutLabels[action];
    const value = document.createElement('span'); value.className = 'shortcut-value'; value.textContent = values.get(action) || '未设置';
    row.append(name, value); container.append(row);
  }
  status.textContent = '快捷键状态已加载';
}

async function load(): Promise<void> {
  try { render(await chrome.commands.getAll()); }
  catch (error: unknown) { status.textContent = error instanceof Error ? `读取失败：${error.message}` : '读取失败'; }
}

async function loadPermission(): Promise<void> {
  const granted = await chrome.permissions.contains({ origins });
  permissionButton.disabled = granted;
  permissionButton.textContent = granted ? '网页访问已允许' : '允许控制网页媒体';
  permissionStatus.textContent = granted ? 'TabTune 可以控制任意已授权网页中的媒体。' : '需要允许 HTTP 和 HTTPS 网页访问。';
}

function openSettings(): void { void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); }
$('button#open').onclick = openSettings;
permissionButton.onclick = () => {
  void chrome.permissions.request({ origins }).then(async (granted) => {
    if (!granted) { permissionStatus.textContent = 'Chrome 未授予网页访问权限。'; return; }
    permissionStatus.textContent = '网页访问已允许，正在刷新…';
    await chrome.runtime.sendMessage({ type: 'REFRESH' }).catch(() => undefined);
    await loadPermission();
  }).catch((error: unknown) => { permissionStatus.textContent = error instanceof Error ? `权限请求失败：${error.message}` : '权限请求失败'; });
};
void Promise.all([load(), loadPermission()]);
