import { shortcutActions, shortcutFromKeyboardEvent, shortcutLabels, type ShortcutMap } from '../shared/shortcuts';

const container = document.querySelector<HTMLDivElement>('#commands')!;
const permissionButton = document.querySelector<HTMLButtonElement>('#permission')!;
const permissionStatus = document.querySelector<HTMLParagraphElement>('#permission-status')!;
const origins = ['http://*/*', 'https://*/*'];
let customShortcuts: ShortcutMap = {};

function render(): void {
  container.replaceChildren();
  for (const action of shortcutActions) {
    const row = document.createElement('label'); row.className = 'command';
    const name = document.createElement('div'); name.className = 'name'; name.textContent = shortcutLabels[action];
    const input = document.createElement('input'); input.className = 'shortcut-input'; input.type = 'text'; input.readOnly = true; input.placeholder = '点击后按组合键'; input.value = customShortcuts[action] ?? '';
    input.setAttribute('aria-label', `${shortcutLabels[action]}快捷键`);
    input.onkeydown = (event) => {
      event.preventDefault();
      if (event.key === 'Escape' || event.key === 'Backspace' || event.key === 'Delete') { delete customShortcuts[action]; input.value = ''; void save(); return; }
      const shortcut = shortcutFromKeyboardEvent(event);
      if (!shortcut) return;
      customShortcuts[action] = shortcut; input.value = shortcut; void save();
    };
    row.append(name, input); container.append(row);
  }
}

async function save(): Promise<void> { await chrome.storage.sync.set({ customShortcuts }); }
async function load(): Promise<void> { const value = await chrome.storage.sync.get('customShortcuts'); customShortcuts = (value.customShortcuts ?? {}) as ShortcutMap; render(); }
async function loadPermission(): Promise<void> {
  const granted = await chrome.permissions.contains({ origins });
  permissionButton.disabled = granted;
  permissionButton.textContent = granted ? '网页访问已允许' : '允许控制网页媒体';
  permissionStatus.textContent = granted ? 'TabTune 可以控制任意已授权网页中的媒体。' : '需要允许 HTTP 和 HTTPS 网页访问。';
}
permissionButton.onclick = () => { void chrome.permissions.request({ origins }).then(async (granted) => { if (!granted) { permissionStatus.textContent = 'Chrome 未授予网页访问权限。'; return; } await chrome.runtime.sendMessage({ type: 'REFRESH' }).catch(() => undefined); await loadPermission(); }); };
void Promise.all([load(), loadPermission()]);
