import { shortcutActions, shortcutFromKeyboardEvent, shortcutLabels, type ShortcutMap } from '../shared/shortcuts';

const $ = <T extends HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
const container = $<HTMLElement>('#shortcuts');
const status = $<HTMLParagraphElement>('#status');
const permissionButton = $<HTMLButtonElement>('#permission');
const permissionStatus = $<HTMLParagraphElement>('#permission-status');
const origins = ['http://*/*', 'https://*/*'];
let customShortcuts: ShortcutMap = {};

function render(): void {
  container.replaceChildren();
  for (const action of shortcutActions) {
    const row = document.createElement('label'); row.className = 'shortcut-row';
    const name = document.createElement('span'); name.className = 'shortcut-name'; name.textContent = shortcutLabels[action];
    const input = document.createElement('input'); input.className = 'shortcut-input'; input.type = 'text'; input.readOnly = true; input.placeholder = '点击后按组合键'; input.value = customShortcuts[action] ?? '';
    input.setAttribute('aria-label', `${shortcutLabels[action]}快捷键`);
    input.onkeydown = (event) => {
      event.preventDefault();
      if (event.key === 'Escape' || event.key === 'Backspace' || event.key === 'Delete') {
        delete customShortcuts[action]; input.value = ''; void save(); return;
      }
      const shortcut = shortcutFromKeyboardEvent(event);
      if (!shortcut) { status.textContent = '请至少按下 Ctrl、Alt、Shift 或 Command 加一个按键。'; return; }
      input.value = shortcut; customShortcuts[action] = shortcut; void save();
    };
    row.append(name, input); container.append(row);
  }
}

async function save(): Promise<void> {
  try { await chrome.storage.sync.set({ customShortcuts }); status.textContent = '已保存'; }
  catch (error: unknown) { status.textContent = error instanceof Error ? `保存失败：${error.message}` : '保存失败'; }
}

async function load(): Promise<void> {
  const value = await chrome.storage.sync.get('customShortcuts');
  customShortcuts = (value.customShortcuts ?? {}) as ShortcutMap;
  render(); status.textContent = '设置已加载';
}

async function loadPermission(): Promise<void> {
  const granted = await chrome.permissions.contains({ origins });
  permissionButton.disabled = granted;
  permissionButton.textContent = granted ? '网页访问已允许' : '允许控制网页媒体';
  permissionStatus.textContent = granted ? 'TabTune 可以控制任意已授权网页中的媒体。' : '需要允许 HTTP 和 HTTPS 网页访问。';
}

permissionButton.onclick = () => {
  void chrome.permissions.request({ origins }).then(async (granted) => {
    if (!granted) { permissionStatus.textContent = 'Chrome 未授予网页访问权限。'; return; }
    permissionStatus.textContent = '网页访问已允许，正在刷新…';
    await chrome.runtime.sendMessage({ type: 'REFRESH' }).catch(() => undefined);
    await loadPermission();
  }).catch((error: unknown) => { permissionStatus.textContent = error instanceof Error ? `权限请求失败：${error.message}` : '权限请求失败'; });
};

void Promise.all([load(), loadPermission()]);
