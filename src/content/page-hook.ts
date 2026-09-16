type HookAction = 'play' | 'pause' | 'toggle-playback' | 'next-track' | 'previous-track' | 'volume-up' | 'volume-down' | 'seek-forward' | 'seek-backward';

const source = 'tabtune-page-hook';
const mediaIds = new Map<HTMLMediaElement, string>();
const mediaItems: HTMLMediaElement[] = [];
const handlers = new Map<MediaSessionAction, MediaSessionActionHandler>();
const nextSelectors = ['.ytp-next-button', '.bpx-player-ctrl-next', '[aria-label*="Next" i]', '[title*="Next" i]', '[aria-label*="下一"]', '[title*="下一"]'];
const previousSelectors = ['.ytp-prev-button', '.bpx-player-ctrl-prev', '[aria-label*="Previous" i]', '[title*="Previous" i]', '[aria-label*="上一"]', '[title*="上一"]'];
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

function firstControl(selectors: string[]): HTMLElement | undefined {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) return element;
  }
  return undefined;
}

function adjustVolume(amount: number): boolean {
  const control = document.querySelector<HTMLInputElement>('input.music-player-volume-slider, input[type="range"][aria-label*="volume" i], input[type="range"][aria-label*="音量"]');
  if (!control) return false;
  const min = Number(control.min || 0);
  const max = Number(control.max || 1);
  const step = Number(control.step || 0.05);
  const value = Math.min(max, Math.max(min, Number(control.value || 0) + amount * (max - min)));
  const next = String(Math.round(value / step) * step);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(control, next); else control.value = next;
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function metadata(): { title?: string; artist?: string; album?: string } | undefined {
  const value = navigator.mediaSession?.metadata;
  if (!value) return undefined;
  return { title: value.title, artist: value.artist, album: value.album };
}

function capabilities(): string[] {
  const item = currentMedia();
  const result = item ? ['play', 'pause', 'volume', ...(item.seekable.length ? ['seek'] : [])] : [];
  if (document.querySelector('input.music-player-volume-slider, input[type="range"][aria-label*="volume" i], input[type="range"][aria-label*="音量"]') && !result.includes('volume')) result.push('volume');
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
  const sessionPlaying = sessionState === 'playing';
  const useSessionState = handlers.size > 0 && sessionState !== undefined;
  const paused = useSessionState ? !sessionPlaying : item?.paused ?? true;
  post({
    type: 'STATE',
    mediaId: item ? mediaIds.get(item) : handlers.size ? 'page-media-session' : undefined,
    paused,
    audible: useSessionState ? sessionPlaying : Boolean(item && !item.paused && !item.muted && item.volume > 0),
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
  const sessionState = navigator.mediaSession?.playbackState;
  const currentlyPlaying = handlers.size > 0 ? sessionState === 'playing' : Boolean(item && !item.paused);
  const effectiveAction = action === 'toggle-playback' ? (currentlyPlaying ? 'pause' : 'play') : action;
  const mediaAction: MediaSessionAction | undefined = effectiveAction === 'next-track' ? 'nexttrack' : effectiveAction === 'previous-track' ? 'previoustrack' : effectiveAction === 'seek-forward' ? 'seekforward' : effectiveAction === 'seek-backward' ? 'seekbackward' : effectiveAction === 'play' ? 'play' : effectiveAction === 'pause' ? 'pause' : undefined;
  if ((effectiveAction === 'next-track' || effectiveAction === 'previous-track' || effectiveAction === 'play' || effectiveAction === 'pause' || effectiveAction === 'seek-forward' || effectiveAction === 'seek-backward') && mediaAction && handlers.has(mediaAction)) {
    await handlers.get(mediaAction)?.({ action: mediaAction, seekOffset: amount ?? 10 });
  } else if (effectiveAction === 'next-track' || effectiveAction === 'previous-track') {
    if (mediaAction && handlers.has(mediaAction)) await handlers.get(mediaAction)?.({ action: mediaAction, seekOffset: amount ?? 10 });
    else {
      const control = firstControl(effectiveAction === 'next-track' ? nextSelectors : previousSelectors);
      if (!control) throw new Error(effectiveAction === 'next-track' ? 'No next track control found' : 'No previous track control found');
      control.click();
    }
  } else if (!item) {
    throw new Error('No controllable media found');
  } else if (effectiveAction === 'play') await item.play();
  else if (effectiveAction === 'pause') item.pause();
  else if (action === 'volume-up' || action === 'volume-down') {
    const delta = (amount ?? 0.05) * (action === 'volume-up' ? 1 : -1);
    if (!adjustVolume(delta)) item.volume = Math.min(1, Math.max(0, item.volume + delta));
  }
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
    .catch((error: unknown) => post({ type: 'RESULT', requestId: message.requestId, status: 'failed', message: error instanceof Error ? error.message : 'Media control failed' }));
});

function patchMediaSession(): void {
  const session = navigator.mediaSession;
  if (!session) return;
  const prototype = Object.getPrototypeOf(session) as MediaSession;
  const originalSetActionHandler = prototype.setActionHandler;
  try {
    prototype.setActionHandler = function(action, handler) {
      if (handler) handlers.set(action, handler); else handlers.delete(action);
      originalSetActionHandler.call(this, action, handler);
      postState();
    };
  } catch { /* some browsers expose read-only MediaSession methods */ }
  const originalSetPositionState = prototype.setPositionState;
  if (originalSetPositionState) {
    try {
      prototype.setPositionState = function(state) {
        if (state) position = { duration: state.duration ?? 0, position: state.position ?? 0, playbackRate: state.playbackRate };
        originalSetPositionState.call(this, state);
        postState();
      };
    } catch { /* some browsers expose read-only MediaSession methods */ }
  }
  const playbackDescriptor = Object.getOwnPropertyDescriptor(prototype, 'playbackState');
  if (playbackDescriptor?.set) {
    try {
      Object.defineProperty(prototype, 'playbackState', {
        ...playbackDescriptor,
        set(this: MediaSession, value: MediaSessionPlaybackState) {
          playbackDescriptor.set?.call(this, value);
          postState();
        }
      });
    } catch { /* some browsers expose read-only MediaSession state */ }
  }
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
if (navigator.mediaSession) window.setInterval(postState, 1000);
