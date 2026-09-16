import type { Action, Capability, Candidate } from '../shared/types';

export interface Adapter {
  capabilities: Capability[];
  execute(action: Action, amount?: number): Promise<{ state: Partial<Candidate>; message?: string }>;
}

const nextSelectors = [
  '.ytp-next-button', '.bpx-player-ctrl-next',
  '[aria-label*="Next" i]', '[title*="Next" i]', '[aria-label*="下一"]', '[title*="下一"]',
  '[aria-label*="Siguiente" i]', '[title*="Siguiente" i]'
];
const previousSelectors = [
  '.ytp-prev-button', '.bpx-player-ctrl-prev',
  '[aria-label*="Previous" i]', '[title*="Previous" i]', '[aria-label*="上一"]', '[title*="上一"]',
  '[aria-label*="Anterior" i]', '[title*="Anterior" i]'
];

const first = (selectors: string[]): HTMLElement | undefined => {
  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return undefined;
};

function clickNext(direction: 'next' | 'previous'): void {
  const selectors = direction === 'next' ? nextSelectors : previousSelectors;
  const control = first(selectors);
  if (!control) throw new Error(direction === 'next' ? '不存在下一项' : '不存在上一项');
  control.click();
}

export function siteAdapter(): Adapter {
  const capabilities: Capability[] = [];
  if (first(nextSelectors)) capabilities.push('next-track');
  if (first(previousSelectors)) capabilities.push('previous-track');
  return {
    capabilities,
    async execute(action, _amount) {
      if (action === 'next-track') { clickNext('next'); return { state: {} }; }
      if (action === 'previous-track') { clickNext('previous'); return { state: {} }; }
      return { state: {}, message: '站点控制回退到通用播放器' };
    }
  };
}
