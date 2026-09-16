import type { Action, Candidate, Capability, CommandRequest, CommandResult, MediaStateMessage } from '../shared/types';
import { siteAdapter } from './adapters';

const mediaId = crypto.randomUUID();
const adapter = siteAdapter();
let media: HTMLMediaElement | undefined;
const attached = new WeakSet<HTMLMediaElement>();
type PageState = { mediaId?: string; paused: boolean; audible: boolean; muted: boolean; volume: number; duration: number; currentTime: number; seekable: boolean; capabilities: string[]; title: string; hostname: string };
const pageCapabilities = new Set<Capability>(['play', 'pause', 'next-track', 'previous-track', 'volume', 'seek']);
let pageState: PageState | undefined;
const pendingPageCommands = new Map<string, { resolve: (result: CommandResult) => void; timer: ReturnType<typeof setTimeout> }>();

async function reportPageState(): Promise<void> {
  if (!pageState?.mediaId) return;
  const state: MediaStateMessage = {
    type: 'MEDIA_STATE',
    state: {
      mediaId: pageState.mediaId, documentId: undefined, audible: pageState.audible, paused: pageState.paused,
      muted: pageState.muted, volume: pageState.volume, duration: pageState.duration, currentTime: pageState.currentTime,
      seekable: pageState.seekable, capabilities: pageState.capabilities.filter((item): item is Capability => pageCapabilities.has(item as Capability)),
      controllable: true, lastInteractionAt: 0, updatedAt: Date.now()
    },
    title: pageState.title || document.title,
    hostname: pageState.hostname || location.hostname
  };
  await chrome.runtime.sendMessage(state).catch(() => undefined);
}

window.addEventListener('message', (event) => {
  const message = event.data as { source?: string; type?: string; requestId?: string; status?: CommandResult['status']; message?: string; mediaId?: string; paused?: boolean; audible?: boolean; muted?: boolean; volume?: number; duration?: number; currentTime?: number; seekable?: boolean; capabilities?: string[]; title?: string; hostname?: string };
  if (message?.source !== 'tabtune-page-hook') return;
  if (message.type === 'STATE') {
    pageState = {
      mediaId: message.mediaId, paused: Boolean(message.paused), audible: Boolean(message.audible), muted: Boolean(message.muted),
      volume: message.volume ?? 1, duration: message.duration ?? 0, currentTime: message.currentTime ?? 0, seekable: Boolean(message.seekable),
      capabilities: message.capabilities ?? [], title: message.title ?? document.title, hostname: message.hostname ?? location.hostname
    };
    void reportPageState();
  } else if (message.type === 'RESULT' && message.requestId) {
    const pending = pendingPageCommands.get(message.requestId);
    if (!pending) return;
    clearTimeout(pending.timer); pendingPageCommands.delete(message.requestId);
    pending.resolve({ type: 'COMMAND_RESULT', requestId: message.requestId, status: message.status ?? 'failed', message: message.message });
  }
});
window.postMessage({ source: 'tabtune-content', type: 'REQUEST_STATE' }, '*');

function findMedia(): HTMLMediaElement | undefined {
  const elements = Array.from(document.querySelectorAll<HTMLMediaElement>('video, audio'));
  const playing = elements.find((item) => !item.paused && !item.ended && item.readyState > 0);
  return playing ?? elements.find((item) => !item.ended) ?? elements[0];
}

function candidateState(): Omit<Candidate, 'tabId' | 'frameId' | 'title' | 'hostname'> {
  media = findMedia();
  const item = media;
  return {
    mediaId,
    documentId: undefined,
    audible: Boolean(item && !item.paused && !item.muted && item.volume > 0),
    paused: item?.paused ?? true,
    muted: item?.muted ?? true,
    volume: item?.volume ?? 0,
    duration: item?.duration ?? 0,
    currentTime: item?.currentTime ?? 0,
    seekable: Boolean(item && item.seekable.length > 0),
    capabilities: [
      ...(item ? ['play', 'pause', 'volume'] as const : []),
      ...(item?.seekable.length ? ['seek'] as const : []),
      ...(adapter?.capabilities.filter((cap) => cap === 'next-track' || cap === 'previous-track') ?? [])
    ],
    controllable: Boolean(item),
    lastInteractionAt: 0,
    updatedAt: Date.now()
  };
}

async function report(): Promise<void> {
  if (pageState?.mediaId) { await reportPageState(); return; }
  if (!findMedia()) return;
  const state: MediaStateMessage = { type: 'MEDIA_STATE', state: candidateState(), title: document.title, hostname: location.hostname };
  await chrome.runtime.sendMessage(state).catch(() => undefined);
}

function executePageCommand(request: CommandRequest): Promise<CommandResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => { pendingPageCommands.delete(request.requestId); resolve({ type: 'COMMAND_RESULT', requestId: request.requestId, status: 'timeout', message: '页面媒体没有返回结果' }); }, 1500);
    pendingPageCommands.set(request.requestId, { resolve, timer });
    window.postMessage({ source: 'tabtune-content', type: 'COMMAND', requestId: request.requestId, action: request.action, amount: request.amount }, '*');
  });
}

async function execute(action: Action, amount?: number): Promise<Partial<Candidate>> {
  if (pageState?.mediaId) {
    const result = await executePageCommand({ type: 'COMMAND', requestId: crypto.randomUUID(), action, amount });
    if (result.status !== 'ok') throw new Error(result.message ?? '页面媒体控制失败');
    return { ...pageState, capabilities: pageState.capabilities.filter((item): item is Capability => pageCapabilities.has(item as Capability)), mediaId: pageState.mediaId, controllable: true };
  }
  const item = findMedia();
  if (!item) throw new Error('没有可控制的媒体');
  media = item;
  if ((action === 'next-track' || action === 'previous-track') && adapter) await adapter.execute(action, amount);
  else if (action === 'play') await item.play();
  else if (action === 'pause') item.pause();
  else if (action === 'toggle-playback') { if (item.paused) await item.play(); else item.pause(); }
  else if (action === 'volume-up' || action === 'volume-down') {
    const delta = (amount ?? 0.05) * (action === 'volume-up' ? 1 : -1);
    item.volume = Math.min(1, Math.max(0, item.volume + delta));
  } else if (action === 'seek-forward' || action === 'seek-backward') {
    const delta = (amount ?? 10) * (action === 'seek-forward' ? 1 : -1);
    item.currentTime = Math.min(item.duration || Number.MAX_SAFE_INTEGER, Math.max(0, item.currentTime + delta));
  }
  void report();
  return candidateState();
}

function interaction(): void {
  void chrome.runtime.sendMessage({ type: 'MEDIA_INTERACTION', mediaId, at: Date.now() });
}

function attach(): void {
  const attachMedia = (item: HTMLMediaElement): void => {
    if (attached.has(item)) return;
    attached.add(item);
    for (const event of ['play', 'pause', 'volumechange', 'seeking', 'loadedmetadata', 'ended']) item.addEventListener(event, report);
    for (const event of ['play', 'volumechange', 'seeking']) item.addEventListener(event, interaction, { passive: true });
  };
  for (const item of Array.from(document.querySelectorAll<HTMLMediaElement>('video, audio'))) attachMedia(item);
  const observer = new MutationObserver(() => {
    for (const item of Array.from(document.querySelectorAll<HTMLMediaElement>('video, audio'))) attachMedia(item);
    void report();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', (event) => { if ((event.target as Element | null)?.closest('video, audio, .ytp-play-button, .bpx-player-ctrl-play')) interaction(); }, { capture: true, passive: true });
  void report();
}

chrome.runtime.onMessage.addListener((message: CommandRequest | { type: 'PROBE' }, _sender, sendResponse) => {
  if (message.type === 'PROBE') { void report().then(() => sendResponse({ ok: true })); return true; }
  if (message.type !== 'COMMAND') return;
  void execute(message.action, message.amount)
    .then((state): CommandResult => ({ type: 'COMMAND_RESULT', requestId: message.requestId, status: 'ok', state }))
    .catch((error: unknown): CommandResult => ({ type: 'COMMAND_RESULT', requestId: message.requestId, status: error instanceof DOMException && error.name === 'NotAllowedError' ? 'autoplay-blocked' : 'failed', message: error instanceof Error ? error.message : '控制失败' }))
    .then(sendResponse);
  return true;
});

attach();
