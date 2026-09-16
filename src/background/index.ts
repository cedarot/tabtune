import type { Action, BackgroundMessage, Candidate, CommandRequest, CommandResult, MediaStateMessage, PopupState, TargetRef } from '../shared/types';
import { createId } from '../shared/id';
import { chooseTarget, removeTab, selectCandidate, targetCandidate, targetKey, updateInteraction, upsertCandidate, type TargetStore } from './targets';

const store: TargetStore = { candidates: new Map() };
let lastError: string | undefined;
const queues = new Map<string, Promise<unknown>>();
const refreshTimeoutMs = 1500;
const targetDiscoveryWaitMs = 100;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => { timer = setTimeout(() => resolve(undefined), timeoutMs); });
  try { return await Promise.race([promise, timeout]); }
  finally { if (timer) clearTimeout(timer); }
}

async function saveTarget(): Promise<void> {
  await chrome.storage.session.set({ target: store.target });
}

async function saveLastError(message: string | undefined): Promise<void> {
  lastError = message;
  if (message) await chrome.storage.session.set({ lastError: message });
  else await chrome.storage.session.remove('lastError');
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
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['content/page-hook.js'], world: 'MAIN' });
  } catch { /* the isolated controller can still handle regular DOM media */ }
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['content/index.js'] });
    await chrome.tabs.sendMessage(tab.id, { type: 'PROBE' }, { frameId: 0 }).catch(() => undefined);
    return true;
  } catch { return false; }
}

function placeholderFor(tab: chrome.tabs.Tab): Candidate | undefined {
  if (tab.id === undefined || !tab.audible) return undefined;
  let hostname = 'Web page';
  try { hostname = new URL(tab.url ?? '').hostname || hostname; } catch { /* restricted tab */ }
  return {
    tabId: tab.id, frameId: 0, mediaId: `tab-${tab.id}`, title: tab.title || 'Audible media tab', hostname,
    audible: true, paused: false, muted: Boolean(tab.mutedInfo?.muted), volume: 0, duration: 0, currentTime: 0,
    seekable: false, capabilities: [], controllable: false, lastInteractionAt: tab.lastAccessed ?? 0, updatedAt: Date.now(),
    error: 'Permission is required to control this page'
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
    await withTimeout(inject(tab).catch(() => false), refreshTimeoutMs);
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

async function resolveTarget(request: CommandRequest): Promise<TargetRef | undefined> {
  let target = targetFor(request);
  const candidate = targetCandidate(store, target);
  if (target && candidate?.controllable) return target;

  // A cold service worker may need to inject the controller before the first
  // shortcut can be delivered. Wait briefly for the resulting MEDIA_STATE
  // message instead of requiring the user to press the shortcut twice.
  await refreshTabs().catch(() => undefined);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    target = targetFor(request);
    if (target && targetCandidate(store, target)?.controllable) return target;
    await new Promise<void>((resolve) => setTimeout(resolve, targetDiscoveryWaitMs));
  }
  return targetFor(request);
}

async function execute(request: CommandRequest): Promise<CommandResult> {
  const target = await resolveTarget(request);
  if (!target) return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'target-gone', message: 'No controllable media found' };
  const candidate = targetCandidate(store, target);
  if (!candidate) return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'target-gone', message: 'The target tab is no longer available' };
  const tab = await chrome.tabs.get(target.tabId).catch(() => undefined);
  if (!tab) { removeTab(store, target.tabId); return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'target-gone', message: 'The target tab was closed' }; }
  const message = { ...request, target };
  try {
    const result = await chrome.tabs.sendMessage<CommandRequest, CommandResult>(target.tabId, message, { frameId: target.frameId });
    if (result?.status === 'ok') { store.target = target; await saveTarget(); }
    return result ?? { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'failed', message: 'The media player returned no result' };
  } catch {
    const injected = await inject(tab);
    if (!injected) return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'permission-required', message: 'Grant webpage access before controlling this site' };
    try {
      const result = await chrome.tabs.sendMessage<CommandRequest, CommandResult>(target.tabId, message, { frameId: target.frameId });
      return result ?? { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'failed', message: 'The media player returned no result' };
    } catch { return { type: 'COMMAND_RESULT', requestId: request.requestId, status: 'failed', message: 'Could not connect to the media player' }; }
  }
}

function queue(request: CommandRequest): Promise<CommandResult> {
  const key = request.target ? targetKey(request.target) : 'automatic';
  const previous = queues.get(key) ?? Promise.resolve();
  const current = previous.then(() => execute(request));
  queues.set(key, current.catch(() => undefined));
  return current;
}

chrome.runtime.onInstalled.addListener(() => { void chrome.storage.session.remove(['target', 'lastError']); void refreshTabs(); });
chrome.runtime.onStartup.addListener(() => {
  void chrome.storage.session.get(['target', 'lastError']).then((value) => { store.target = value.target as TargetRef | undefined; lastError = value.lastError as string | undefined; return refreshTabs(); });
});
chrome.tabs.onRemoved.addListener((tabId) => removeTab(store, tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { if (changeInfo.status === 'complete' || changeInfo.audible) { ensurePlaceholder(tab); void inject(tab); } });
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  removeTab(store, removedTabId);
  void chrome.tabs.get(addedTabId).then((tab) => { ensurePlaceholder(tab); return inject(tab); }).catch(() => undefined);
});
chrome.permissions.onAdded.addListener(() => { void refreshTabs(); });

chrome.runtime.onMessage.addListener((message: BackgroundMessage | MediaStateMessage | { type: 'MEDIA_INTERACTION'; mediaId: string; at: number }, sender, sendResponse) => {
  if (message.type === 'MEDIA_STATE') { mergeState(sender, message); return; }
  if (message.type === 'MEDIA_INTERACTION') {
    if (sender.tab?.id !== undefined && updateInteraction(store, sender.tab.id, sender.frameId ?? 0, message.mediaId, message.at)) void saveTarget();
    return;
  }
  if (message.type === 'GET_STATE') {
    void refreshTabs()
      .catch((error: unknown) => { lastError = error instanceof Error ? error.message : 'Could not refresh media tabs'; })
      .then(() => new Promise<void>((resolve) => setTimeout(resolve, 100)))
      .then(commands)
      .then((registered) => sendResponse({ ...toPopupState(), commands: registered }));
    return true;
  }
  if (message.type === 'REFRESH') {
    void refreshTabs()
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => sendResponse({ ok: false, message: error instanceof Error ? error.message : 'Could not refresh media tabs' }));
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
  if (message.type === 'COMMAND') { void queue(message).then((result) => { void saveLastError(result.status === 'ok' ? undefined : result.message ?? 'Media control failed').catch(() => undefined); sendResponse(result); }); return true; }
  return false;
});

chrome.commands.onCommand.addListener((name) => {
  const action = name as Action;
  if (!['toggle-playback', 'next-track', 'previous-track', 'volume-up', 'volume-down', 'seek-forward', 'seek-backward'].includes(action)) return;
  void queue({ type: 'COMMAND', requestId: createId('command'), action })
    .then((result) => { void saveLastError(result.status === 'ok' ? undefined : result.message ?? 'Media control failed').catch(() => undefined); })
    .catch((error: unknown) => { void saveLastError(error instanceof Error ? error.message : 'Media control failed').catch(() => undefined); });
});
