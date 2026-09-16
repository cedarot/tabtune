import type { Action, Candidate, CommandRequest, CommandResult, MediaStateMessage } from '../shared/types';
import { siteAdapter } from './adapters';

const mediaId = crypto.randomUUID();
const adapter = siteAdapter();
let media: HTMLMediaElement | undefined;
const attached = new WeakSet<HTMLMediaElement>();

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

function report(): void {
  const state: MediaStateMessage = { type: 'MEDIA_STATE', state: candidateState(), title: document.title, hostname: location.hostname };
  void chrome.runtime.sendMessage(state);
}

async function execute(action: Action, amount?: number): Promise<Partial<Candidate>> {
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
  report();
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
    report();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', (event) => { if ((event.target as Element | null)?.closest('video, audio, .ytp-play-button, .bpx-player-ctrl-play')) interaction(); }, { capture: true, passive: true });
  report();
}

chrome.runtime.onMessage.addListener((message: CommandRequest | { type: 'PROBE' }, _sender, sendResponse) => {
  if (message.type === 'PROBE') { report(); sendResponse({ ok: true }); return; }
  if (message.type !== 'COMMAND') return;
  void execute(message.action, message.amount)
    .then((state): CommandResult => ({ type: 'COMMAND_RESULT', requestId: message.requestId, status: 'ok', state }))
    .catch((error: unknown): CommandResult => ({ type: 'COMMAND_RESULT', requestId: message.requestId, status: error instanceof DOMException && error.name === 'NotAllowedError' ? 'autoplay-blocked' : 'failed', message: error instanceof Error ? error.message : '控制失败' }))
    .then(sendResponse);
  return true;
});

attach();
