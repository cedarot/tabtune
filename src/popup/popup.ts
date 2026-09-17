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
    const value = document.createElement('span'); value.className = 'shortcut-value'; value.textContent = values.get(action) || 'Not set';
    row.append(name, value); container.append(row);
  }
  status.textContent = 'Shortcut status loaded';
}

async function load(): Promise<void> {
  try { render(await chrome.commands.getAll()); }
  catch (error: unknown) { status.textContent = error instanceof Error ? `Read failed: ${error.message}` : 'Read failed'; }
}

async function loadPermission(): Promise<void> {
  const granted = await chrome.permissions.contains({ origins });
  permissionButton.disabled = granted;
  permissionButton.textContent = granted ? 'Web access allowed' : 'Allow webpage media control';
  permissionStatus.textContent = granted ? 'TabTune can control media in any permitted webpage.' : 'HTTP and HTTPS access is required.';
}

function openSettings(): void { void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); }
$('button#open').onclick = openSettings;
permissionButton.onclick = () => {
  void chrome.permissions.request({ origins }).then(async (granted) => {
    if (!granted) { permissionStatus.textContent = 'Chrome did not grant webpage access.'; return; }
    permissionStatus.textContent = 'Web access granted; refreshing…';
    await chrome.runtime.sendMessage({ type: 'REFRESH' }).catch(() => undefined);
    await loadPermission();
  }).catch((error: unknown) => { permissionStatus.textContent = error instanceof Error ? `Permission request failed: ${error.message}` : 'Permission request failed'; });
};
void Promise.all([load(), loadPermission()]);
