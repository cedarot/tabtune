import type { Action, Capability, Candidate } from '../shared/types';

export interface Adapter {
  capabilities: Capability[];
  execute(action: Action, amount?: number): Promise<{ state: Partial<Candidate>; message?: string }>;
}

const first = (selectors: string[]): HTMLElement | undefined => {
  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return undefined;
};

function clickNext(direction: 'next' | 'previous'): void {
  const selectors = direction === 'next'
    ? ['.ytp-next-button', 'button[aria-label*="Next"]', '.bpx-player-ctrl-next', '.bpx-player-ctrl-btn[aria-label*="下一"]']
    : ['.ytp-prev-button', 'button[aria-label*="Previous"]', '.bpx-player-ctrl-prev', '.bpx-player-ctrl-btn[aria-label*="上一"]'];
  const control = first(selectors);
  if (!control) throw new Error(direction === 'next' ? '不存在下一项' : '不存在上一项');
  control.click();
}

export function siteAdapter(): Adapter | undefined {
  const host = location.hostname;
  const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com');
  const isBilibili = host === 'bilibili.com' || host.endsWith('.bilibili.com');
  if (!isYouTube && !isBilibili) return undefined;
  return {
    capabilities: ['play', 'pause', 'next-track', 'previous-track', 'volume', 'seek'],
    async execute(action, _amount) {
      if (action === 'next-track') { clickNext('next'); return { state: {} }; }
      if (action === 'previous-track') { clickNext('previous'); return { state: {} }; }
      return { state: {}, message: '站点控制回退到通用播放器' };
    }
  };
}
