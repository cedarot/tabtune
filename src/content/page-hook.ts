type HookAction = 'play' | 'pause' | 'toggle-playback' | 'next-track' | 'previous-track' | 'volume-up' | 'volume-down' | 'seek-forward' | 'seek-backward';

const source = 'tabtune-page-hook';
const mediaIds = new Map<HTMLMediaElement, string>();
const mediaItems: HTMLMediaElement[] = [];
const handlers = new Map<MediaSessionAction, MediaSessionActionHandler>();
let activeMedia: HTMLMediaElement | undefined;
let nextMediaId = 1;
let position: { duration: number; position: number; playbackRate?: number } | undefined;

function post(message: Record<string, unknown>): void {
  window.postMessage({ source, ...message }, '*');
}

function track(item: HTMLMediaElement): void {
  if (mediaIds.has(item)) return;
  mediaIds.set(item, `page-media-${nextMediaId++}`);
  mediaItems.push(item);
  for (const event of ['play', 'pause', 'volumechange', 'loadedmetadata', 'durationchange', 'timeupdate', 'ended', 'emptied', 'error']) {
    item.addEventListener(event, () => {
      if (event === 'play') activeMedia = item;
      postState();
    });
  }
  postState();
}

function currentMedia(): HTMLMediaElement | undefined {
  if (activeMedia && !activeMedia.ended) return activeMedia;
  return mediaItems.find((item) => !item.paused && !item.ended) ?? mediaItems.find((item) => !item.ended);
}

function metadata(): { title?: string; artist?: string; album?: string } | undefined {
  const value = navigator.mediaSession?.metadata;
  if (!value) return undefined;
  return { title: value.title, artist: value.artist, album: value.album };
}

function capabilities(): string[] {
  const item = currentMedia();
  const result = item ? ['play', 'pause', 'volume', ...(item.seekable.length ? ['seek'] : [])] : [];
  if (handlers.has('nexttrack')) result.push('next-track');
  if (handlers.has('previoustrack')) result.push('previous-track');
  if (handlers.has('seekforward') || handlers.has('seekbackward')) {
    if (!result.includes('seek')) result.push('seek');
  }
  return result;
}

function postState(): void {
  const item = currentMedia();
  const sessionState = navigator.mediaSession?.playbackState;
  post({
    type: 'STATE',
    mediaId: item ? mediaIds.get(item) : handlers.size ? 'page-media-session' : undefined,
    paused: item ? item.paused : sessionState !== 'playing',
    audible: item ? !item.paused && !item.muted && item.volume > 0 : sessionState === 'playing',
    muted: item?.muted ?? false,
    volume: item?.volume ?? 1,
    duration: item?.duration ?? position?.duration ?? 0,
    currentTime: item?.currentTime ?? position?.position ?? 0,
    seekable: Boolean(item?.seekable.length || position?.duration),
    capabilities: capabilities(),
    title: metadata()?.title || document.title,
    hostname: location.hostname
  });
}

async function invoke(action: HookAction, amount?: number): Promise<void> {
  const item = currentMedia();
  const mediaAction: MediaSessionAction | undefined = action === 'next-track' ? 'nexttrack' : action === 'previous-track' ? 'previoustrack' : action === 'seek-forward' ? 'seekforward' : action === 'seek-backward' ? 'seekbackward' : action === 'play' ? 'play' : action === 'pause' ? 'pause' : action === 'toggle-playback' ? (item?.paused || navigator.mediaSession?.playbackState !== 'playing' ? 'play' : 'pause') : undefined;
  if ((action === 'next-track' || action === 'previous-track' || action === 'play' || action === 'pause' || action === 'toggle-playback' || action === 'seek-forward' || action === 'seek-backward') && mediaAction && handlers.has(mediaAction) && !item) {
    await handlers.get(mediaAction)?.({ action: mediaAction, seekOffset: amount ?? 10 });
  } else if (action === 'next-track' || action === 'previous-track') {
    if (!mediaAction || !handlers.has(mediaAction)) throw new Error(action === 'next-track' ? '不存在下一项' : '不存在上一项');
    await handlers.get(mediaAction)?.({ action: mediaAction, seekOffset: amount ?? 10 });
  } else if (!item) {
    throw new Error('没有可控制的媒体');
  } else if (action === 'play') await item.play();
  else if (action === 'pause') item.pause();
  else if (action === 'toggle-playback') { if (item.paused) await item.play(); else item.pause(); }
  else if (action === 'volume-up' || action === 'volume-down') item.volume = Math.min(1, Math.max(0, item.volume + (amount ?? 0.05) * (action === 'volume-up' ? 1 : -1)));
  else if (action === 'seek-forward' || action === 'seek-backward') item.currentTime = Math.min(item.duration || Number.MAX_SAFE_INTEGER, Math.max(0, item.currentTime + (amount ?? 10) * (action === 'seek-forward' ? 1 : -1)));
  postState();
}

window.addEventListener('message', (event) => {
  const message = event.data as { source?: string; type?: string; requestId?: string; action?: HookAction; amount?: number };
  if (message?.source !== 'tabtune-content') return;
  if (message.type === 'REQUEST_STATE') { postState(); return; }
  if (message.type !== 'COMMAND' || !message.requestId || !message.action) return;
  void invoke(message.action, message.amount)
    .then(() => post({ type: 'RESULT', requestId: message.requestId, status: 'ok' }))
    .catch((error: unknown) => post({ type: 'RESULT', requestId: message.requestId, status: 'failed', message: error instanceof Error ? error.message : '控制失败' }));
});

function patchMediaSession(): void {
  const session = navigator.mediaSession;
  if (!session) return;
  const prototype = Object.getPrototypeOf(session) as MediaSession;
  const originalSetActionHandler = prototype.setActionHandler;
  prototype.setActionHandler = function(action, handler) {
    if (handler) handlers.set(action, handler); else handlers.delete(action);
    originalSetActionHandler.call(this, action, handler);
    postState();
  };
  const originalSetPositionState = prototype.setPositionState;
  prototype.setPositionState = function(state) {
    if (!state) return;
    position = { duration: state.duration ?? 0, position: state.position ?? 0, playbackRate: state.playbackRate };
    originalSetPositionState.call(this, state);
    postState();
  };
  postState();
}

const originalCreateElement = Document.prototype.createElement;
Document.prototype.createElement = function(this: Document, tagName: string, options?: ElementCreationOptions): HTMLElement {
  const element = originalCreateElement.call(this, tagName, options);
  if (tagName.toLowerCase() === 'audio' || tagName.toLowerCase() === 'video') track(element as HTMLMediaElement);
  return element;
} as typeof originalCreateElement;
const OriginalAudio = window.Audio;
window.Audio = function(src?: string) {
  const item = new OriginalAudio(src);
  track(item);
  return item;
} as unknown as typeof Audio;
for (const item of Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video'))) track(item);
patchMediaSession();
postState();
