import { describe, expect, it } from 'vitest';
import { chooseTarget, removeTab, selectCandidate, targetCandidate, targetKey, updateInteraction, upsertCandidate, type TargetStore } from '../../src/background/targets';
import type { Candidate } from '../../src/shared/types';

const candidate = (overrides: Partial<Candidate> = {}): Candidate => ({
  tabId: 1, frameId: 0, mediaId: 'media-1', title: 'Video', hostname: 'example.test', audible: true, paused: false,
  muted: false, volume: 1, duration: 100, currentTime: 10, seekable: true, capabilities: ['play', 'pause', 'volume', 'seek'],
  controllable: true, lastInteractionAt: 1, updatedAt: 1, ...overrides
});

describe('target selection', () => {
  it('keeps the selected target when another tab becomes audible', () => {
    const store: TargetStore = { candidates: new Map() };
    const first = candidate(); const second = candidate({ tabId: 2, mediaId: 'media-2', lastInteractionAt: 2 });
    upsertCandidate(store, first); upsertCandidate(store, second); selectCandidate(store, first);
    upsertCandidate(store, { ...second, audible: true, lastInteractionAt: 99 });
    expect(chooseTarget(store)?.tabId).toBe(1);
  });

  it('updates the target from a real media interaction unless fixed', () => {
    const store: TargetStore = { candidates: new Map() };
    const first = candidate(); const second = candidate({ tabId: 2, mediaId: 'media-2' });
    upsertCandidate(store, first); upsertCandidate(store, second); selectCandidate(store, first);
    updateInteraction(store, 2, 0, 'media-2', 20);
    expect(store.target?.tabId).toBe(2);
    selectCandidate(store, first, 'fixed'); updateInteraction(store, 2, 0, 'media-2', 30);
    expect(store.target?.tabId).toBe(1);
  });

  it('clears a closed tab and resolves the candidate by stable key', () => {
    const store: TargetStore = { candidates: new Map() }; const item = candidate();
    upsertCandidate(store, item); selectCandidate(store, item);
    expect(targetCandidate(store)?.mediaId).toBe('media-1'); expect(targetKey(item)).toBe('1:0:media-1');
    removeTab(store, 1); expect(store.target).toBeUndefined(); expect(store.candidates.size).toBe(0);
  });
});
