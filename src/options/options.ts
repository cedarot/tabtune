import { shortcutActions, shortcutLabels } from '../shared/shortcuts';

const container = document.querySelector<HTMLDivElement>('#commands')!;
const permissionButton = document.querySelector<HTMLButtonElement>('#permission')!;
const permissionStatus = document.querySelector<HTMLParagraphElement>('#permission-status')!;
const errorStatus = document.querySelector<HTMLParagraphElement>('#error-status')!;
const origins = ['http://*/*', 'https://*/*'];

function render(commands: chrome.commands.Command[]): void {
  const values = new Map(commands.map((command) => [command.name, command.shortcut]));
  container.replaceChildren();
  for (const action of shortcutActions) {
    const row = document.createElement('div'); row.className = 'command';
    const name = document.createElement('div'); name.className = 'name'; name.textContent = shortcutLabels[action];
    const shortcut = document.createElement('div'); shortcut.className = `shortcut${values.get(action) ? '' : ' unset'}`; shortcut.textContent = values.get(action) || 'Not set';
    row.append(name, shortcut); container.append(row);
  }
}

async function load(): Promise<void> {
  const [commands, state] = await Promise.all([
    chrome.commands.getAll(),
    chrome.runtime.sendMessage({ type: 'GET_STATE' }) as Promise<{ lastError?: string }>
  ]);
  render(commands);
  errorStatus.textContent = state.lastError ? `Last command error: ${state.lastError}` : '';
}
async function loadPermission(): Promise<void> {
  const granted = await chrome.permissions.contains({ origins });
  permissionButton.disabled = granted;
  permissionButton.textContent = granted ? 'Web access allowed' : 'Allow webpage media control';
  permissionStatus.textContent = granted ? 'TabTune can control media in any permitted webpage.' : 'HTTP and HTTPS access is required.';
}
function openSettings(): void { void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); }
document.querySelector<HTMLButtonElement>('#open')!.onclick = openSettings;
permissionButton.onclick = () => { void chrome.permissions.request({ origins }).then(async (granted) => { if (!granted) { permissionStatus.textContent = 'Chrome did not grant webpage access.'; return; } permissionStatus.textContent = 'Web access granted; refreshing…'; await chrome.runtime.sendMessage({ type: 'REFRESH' }).catch(() => undefined); await loadPermission(); }).catch((error: unknown) => { permissionStatus.textContent = error instanceof Error ? `Permission request failed: ${error.message}` : 'Permission request failed'; }); };
void Promise.all([load(), loadPermission()]);
