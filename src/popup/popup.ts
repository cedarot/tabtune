import type { Candidate, PopupState, TargetRef } from '../shared/types';
import { commandMessage } from '../shared/protocol';

const $ = <T extends HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
let state: PopupState = { candidates: [], commands: [] };

function selected(candidate: Candidate): boolean {
  return Boolean(state.target && state.target.tabId === candidate.tabId && state.target.frameId === candidate.frameId && state.target.mediaId === candidate.mediaId);
}

function render(): void {
  const target = $('section#target');
  const current = state.target && state.candidates.find((candidate) => selected(candidate));
  target.innerHTML = current ? `<div class="candidate selected"><div class="candidate-info"><div class="candidate-title">当前目标：${escapeHtml(current.title)}</div><div class="candidate-meta">${escapeHtml(current.hostname)} · ${current.paused ? '已暂停' : '播放中'}${state.target?.mode === 'fixed' ? ' · 已固定' : ''}</div></div></div>` : '<div class="candidate"><div class="candidate-info">尚未选择控制目标</div></div>';
  const list = $('section#candidates');
  list.innerHTML = '';
  for (const candidate of state.candidates) {
    const row = document.createElement('div'); row.className = `candidate${selected(candidate) ? ' selected' : ''}`;
    const info = document.createElement('div'); info.className = 'candidate-info';
    info.innerHTML = `<div class="candidate-title">${escapeHtml(candidate.title || '未命名媒体')}</div><div class="candidate-meta">${escapeHtml(candidate.hostname)} · ${candidate.paused ? '已暂停' : '正在播放'}${candidate.muted ? ' · 静音' : ''}</div>`;
    const select = document.createElement('button'); select.textContent = selected(candidate) ? '当前' : '选择'; select.ariaLabel = `选择 ${candidate.title || candidate.hostname}`; select.onclick = () => { void chrome.runtime.sendMessage({ type: 'SELECT_TARGET', target: toTarget(candidate), fixed: false }).then(load); };
    const fixed = document.createElement('button'); fixed.textContent = selected(candidate) && state.target?.mode === 'fixed' ? '解除固定' : '固定'; fixed.ariaLabel = `固定 ${candidate.title || candidate.hostname}`; fixed.onclick = () => { void chrome.runtime.sendMessage({ type: 'SELECT_TARGET', target: toTarget(candidate), fixed: !(selected(candidate) && state.target?.mode === 'fixed') }).then(load); };
    row.append(info, select, fixed); list.append(row);
  }
  $('p#status').textContent = state.lastError ?? (state.candidates.length ? `${state.candidates.length} 个媒体标签页` : '没有检测到发声标签页');
}

function toTarget(candidate: Candidate): TargetRef { return { tabId: candidate.tabId, frameId: candidate.frameId, documentId: candidate.documentId, mediaId: candidate.mediaId, selectedAt: Date.now(), mode: 'automatic' }; }
function escapeHtml(value: string): string { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
async function load(): Promise<void> { state = await chrome.runtime.sendMessage({ type: 'GET_STATE' }) as PopupState; render(); }

document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => button.onclick = () => { void chrome.runtime.sendMessage(commandMessage(button.dataset.action as Parameters<typeof commandMessage>[0], state.target)); });
$('button#refresh').onclick = () => { void load(); };
$('button#shortcuts').onclick = () => { void chrome.runtime.openOptionsPage(); };
$('button#permission').onclick = () => { void chrome.runtime.sendMessage({ type: 'REQUEST_PERMISSION', origins: ['http://*/*', 'https://*/*'] }).then(load); };
void load();
