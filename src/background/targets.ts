import type { Candidate, TargetRef } from '../shared/types';

export interface TargetStore {
  candidates: Map<string, Candidate>;
  target?: TargetRef;
}

export function targetKey(target: Pick<TargetRef, 'tabId' | 'frameId' | 'mediaId'>): string {
  return `${target.tabId}:${target.frameId}:${target.mediaId}`;
}

export function upsertCandidate(store: TargetStore, candidate: Candidate): void {
  store.candidates.set(targetKey(candidate), candidate);
  if (store.target && store.target.tabId === candidate.tabId && store.target.frameId === candidate.frameId && store.target.mediaId === candidate.mediaId && candidate.documentId && store.target.documentId !== candidate.documentId) {
    store.target = undefined;
  }
}

export function removeTab(store: TargetStore, tabId: number): void {
  for (const [key, candidate] of store.candidates) if (candidate.tabId === tabId) store.candidates.delete(key);
  if (store.target?.tabId === tabId) store.target = undefined;
}

export function selectCandidate(store: TargetStore, candidate: Candidate, mode: TargetRef['mode'] = 'automatic'): TargetRef {
  const target: TargetRef = {
    tabId: candidate.tabId,
    frameId: candidate.frameId,
    documentId: candidate.documentId,
    mediaId: candidate.mediaId,
    selectedAt: Date.now(),
    mode
  };
  store.target = target;
  return target;
}

export function chooseTarget(store: TargetStore): TargetRef | undefined {
  if (store.target && store.candidates.has(targetKey(store.target))) return store.target;
  const candidates = [...store.candidates.values()].filter((c) => c.controllable && (c.audible || !c.paused));
  candidates.sort((a, b) => b.lastInteractionAt - a.lastInteractionAt || b.updatedAt - a.updatedAt || a.tabId - b.tabId);
  const candidate = candidates[0];
  return candidate ? selectCandidate(store, candidate) : undefined;
}

export function updateInteraction(store: TargetStore, tabId: number, frameId: number, mediaId: string, at = Date.now()): TargetRef | undefined {
  const candidate = [...store.candidates.values()].find((c) => c.tabId === tabId && c.frameId === frameId && c.mediaId === mediaId);
  if (!candidate) return undefined;
  candidate.lastInteractionAt = at;
  candidate.updatedAt = at;
  if (store.target?.mode !== 'fixed') return selectCandidate(store, candidate);
  return store.target;
}

export function targetCandidate(store: TargetStore, target?: TargetRef): Candidate | undefined {
  const actual = target ?? store.target;
  return actual ? store.candidates.get(targetKey(actual)) : undefined;
}
