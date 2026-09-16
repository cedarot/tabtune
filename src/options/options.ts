import { shortcutActions, shortcutLabels } from '../shared/shortcuts';

const container = document.querySelector<HTMLDivElement>('#commands')!;
const permissionButton = document.querySelector<HTMLButtonElement>('#permission')!;
const permissionStatus = document.querySelector<HTMLParagraphElement>('#permission-status')!;
const origins = ['http://*/*', 'https://*/*'];

function render(commands: chrome.commands.Command[]): void {
  const values = new Map(commands.map((command) => [command.name, command.shortcut]));
  container.replaceChildren();
  for (const action of shortcutActions) {
    const row = document.createElement('div'); row.className = 'command';
    const name = document.createElement('div'); name.className = 'name'; name.textContent = shortcutLabels[action];
    const shortcut = document.createElement('div'); shortcut.className = `shortcut${values.get(action) ? '' : ' unset'}`; shortcut.textContent = values.get(action) || '未设置';
    row.append(name, shortcut); container.append(row);
  }
}

async function load(): Promise<void> { render(await chrome.commands.getAll()); }
async function loadPermission(): Promise<void> {
  const granted = await chrome.permissions.contains({ origins });
  permissionButton.disabled = granted;
  permissionButton.textContent = granted ? '网页访问已允许' : '允许控制网页媒体';
  permissionStatus.textContent = granted ? 'TabTune 可以控制任意已授权网页中的媒体。' : '需要允许 HTTP 和 HTTPS 网页访问。';
}
function openSettings(): void { void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); }
document.querySelector<HTMLButtonElement>('#open')!.onclick = openSettings;
permissionButton.onclick = () => { void chrome.permissions.request({ origins }).then(async (granted) => { if (!granted) { permissionStatus.textContent = 'Chrome 未授予网页访问权限。'; return; } await chrome.runtime.sendMessage({ type: 'REFRESH' }).catch(() => undefined); await loadPermission(); }); };
void Promise.all([load(), loadPermission()]);
