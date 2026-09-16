import type { Action, BackgroundMessage, Candidate, CommandRequest, CommandResult, MediaStateMessage, PopupState, TargetRef } from '../shared/types';
import { chooseTarget, removeTab, selectCandidate, targetCandidate, targetKey, updateInteraction, upsertCandidate, type TargetStore } from './targets';

const store: TargetStore = { candidates: new Map() };
let lastError: string | undefined;
const queues = new Map<string, Promise<unknown>>();
const refreshTimeoutMs = 1500;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => { timer = setTimeout(() => resolve(undefined), timeoutMs); });
  try { return await Promise.race([promise, timeout]); }
  finally { if (timer) clearTimeout(timer); }
}

async function saveTarget(): Promise<void> {
  await chrome.storage.session.set({ target: store.target });
}

function hostPattern(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
    return `${parsed.protocol}//${parsed.hostname}/*`;
  } catch { return undefined; }
}

async function canInject(url: string): Promise<boolean> {
  const origin = hostPattern(url);
  return Boolean(origin && await chrome.permissions.contains({ origins: [origin] }));
}

async function inject(tab: chrome.tabs.Tab): Promise<boolean> {
  if (tab.id === undefined || !tab.url || !(await canInject(tab.url))) return false;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'PROBE' }, { frameId: 0 });
    return true;
  } catch { /* content script is not loaded yet */ }
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/page-hook.js'], world: 'MAIN' });
  } catch { /* the isolated controller can still handle regular DOM media */ }
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/index.js'] });
    await chrome.tabs.sendMessage(tab.id, { type: 'PROBE' }, { frameId: 0 }).catch(() => undefined);
    return true;
  } catch { return false; }
}

function placeholderFor(tab: chrome.tabs.Tab): Candidate | undefined {
  if (tab.id === undefined || !tab.audible) return undefined;
  let hostname = '网页';
  try { hostname = new URL(tab.url ?? '').hostname || hostname; } catch { /* restricted tab */ }
  return {
    tabId: tab.id, frameId: 0, mediaId: `tab-${tab.id}`, title: tab.title || '正在发声的标签页', hostname,
    audible: true, paused: false, muted: Boolean(tab.mutedInfo?.muted), volume: 0, duration: 0, currentTime: 0,
    seekable: false, capabilities: [], controllable: false, lastInteractionAt: tab.lastAccessed ?? 0, updatedAt: Date.now(),
    error: '需要授权才能控制此网页'
  };
}

function ensurePlaceholder(tab: chrome.tabs.Tab): void {
  const placeholder = placeholderFor(tab);
  if (!placeholder) return;
  const existing = [...store.candidates.values()].find((candidate) => candidate.tabId === tab.id && candidate.controllable);
  if (!existing) upsertCandidate(store, placeholder);
}

async function refreshTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  await Promise.all(tabs.map(async (tab) => {
    if (tab.id === undefined) return;
    ensurePlaceholder(tab);
    if (tab.audible) await withTimeout(inject(tab).catch(() => false), refreshTimeoutMs);
  }));
}

function mergeState(sender: chrome.runtime.MessageSender, message: MediaStateMessage): void {
  if (sender.tab?.id === undefined) return;
  for (const [key, existing] of store.candidates) {
    if (existing.tabId === sender.tab.id && existing.frameId === (sender.frameId ?? 0) && !existing.controllable) store.candidates.delete(key);
  }
  const candidate: Candidate = {
    ...message.state,
    tabId: sender.tab.id,
    frameId: sender.frameId ?? 0,
    title: message.title,
    hostname: message.hostname,
    documentId: sender.documentId,
    updatedAt: Date.now()
  };
  upsertCandidate(store, candidate);
}

function toPopupState(): PopupState {
  const target = chooseTarget(store);
  return { candidates: [...store.candidates.values()].sort((a, b) => Number(b.audible) - Number(a.audible) || b.lastInteractionAt - a.lastInteractionAt || a.tabId - b.tabId), target, lastError, commands: [] };
}

async function commands(): Promise<chrome.commands.Command[]> {
  return chrome.commands.getAll();
}

function targetFor(request: CommandRequest): TargetRef | undefined {
  if (request.target) return request.target;
  return chooseTarget(store);
}

async function execute(request: CommandRequest): Promise<CommandResult> {
  const target = targetFor(request);
  if (!target) return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'target-gone', message: '没有可控制的媒体' };
  const candidate = targetCandidate(store, target);
  if (!candidate) return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'target-gone', message: '目标标签页已失效' };
  const tab = await chrome.tabs.get(target.tabId).catch(() => undefined);
  if (!tab) { removeTab(store, target.tabId); return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'target-gone', message: '目标标签页已关闭' }; }
  const message = { ...request, target };
  try {
    const result = await chrome.tabs.sendMessage<CommandRequest, CommandResult>(target.tabId, message, { frameId: target.frameId });
    if (result?.status === 'ok') { store.target = target; await saveTarget(); }
    return result ?? { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'failed', message: '播放器没有返回结果' };
  } catch {
    const injected = await inject(tab);
    if (!injected) return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'permission-required', message: '请先授予此网站的访问权限' };
    try {
      const result = await chrome.tabs.sendMessage<CommandRequest, CommandResult>(target.tabId, message, { frameId: target.frameId });
      return result ?? { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'failed', message: '播放器没有返回结果' };
    } catch { return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'failed', message: '无法连接到播放器' }; }
  }
}

function queue(request: CommandRequest): Promise<CommandResult> {
  const key = request.target ? targetKey(request.target) : 'automatic';
  const previous = queues.get(key) ?? Promise.resolve();
  const current = previous.then(() => execute(request));
  queues.set(key, current.catch(() => undefined));
  return current;
}

chrome.runtime.onInstalled.addListener(() => { void chrome.storage.session.remove('target'); void refreshTabs(); });
chrome.runtime.onStartup.addListener(() => {
  void chrome.storage.session.get('target').then((value) => { store.target = value.target as TargetRef | undefined; return refreshTabs(); });
});
chrome.tabs.onRemoved.addListener((tabId) => removeTab(store, tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { if (changeInfo.status === 'complete' || changeInfo.audible) { ensurePlaceholder(tab); void inject(tab); } });
chrome.permissions.onAdded.addListener(() => { void refreshTabs(); });

chrome.runtime.onMessage.addListener((message: BackgroundMessage | MediaStateMessage | { type: 'MEDIA_INTERACTION'; mediaId: string; at: number }, sender, sendResponse) => {
  if (message.type === 'MEDIA_STATE') { mergeState(sender, message); return; }
  if (message.type === 'MEDIA_INTERACTION') {
    if (sender.tab?.id !== undefined && updateInteraction(store, sender.tab.id, sender.frameId ?? 0, message.mediaId, message.at)) void saveTarget();
    return;
  }
  if (message.type === 'GET_STATE') {
    void refreshTabs()
      .catch((error: unknown) => { lastError = error instanceof Error ? error.message : '无法刷新媒体标签页'; })
      .then(() => new Promise<void>((resolve) => setTimeout(resolve, 100)))
      .then(commands)
      .then((registered) => sendResponse({ ...toPopupState(), commands: registered }));
    return true;
  }
  if (message.type === 'REFRESH') {
    void refreshTabs()
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => sendResponse({ ok: false, message: error instanceof Error ? error.message : '无法刷新媒体标签页' }));
    return true;
  }
  if (message.type === 'SELECT_TARGET') {
    const candidate = store.candidates.get(targetKey(message.target));
    if (candidate) { selectCandidate(store, candidate, message.fixed ? 'fixed' : 'automatic'); void saveTarget(); }
    sendResponse({ ok: Boolean(candidate) });
    return;
  }
  if (message.type === 'REQUEST_PERMISSION') {
    void chrome.permissions.request({ origins: message.origins }).then((granted) => { if (granted) void refreshTabs(); sendResponse({ granted }); });
    return true;
  }
  if (message.type === 'COMMAND') { void queue(message).then((result) => { if (result.status !== 'ok') { lastError = result.message; void chrome.action.setBadgeText({ text: '!' }); } else { lastError = undefined; void chrome.action.setBadgeText({ text: '' }); } sendResponse(result); }); return true; }
  return false;
});

chrome.commands.onCommand.addListener((name) => {
  const action = name as Action;
  if (!['play', 'pause', 'toggle-playback', 'next-track', 'previous-track', 'volume-up', 'volume-down', 'seek-forward', 'seek-backward'].includes(action)) return;
  void queue({ type: 'COMMAND', requestId: crypto.randomUUID(), action }).catch((error: unknown) => { lastError = error instanceof Error ? error.message : '控制失败'; });
});
