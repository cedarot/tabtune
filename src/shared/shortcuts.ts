import type { Action } from './types';

export const shortcutActions: Action[] = [
  'play', 'pause', 'toggle-playback', 'next-track', 'previous-track',
  'volume-up', 'volume-down', 'seek-forward', 'seek-backward'
];

export const shortcutLabels: Record<Action, string> = {
  play: '播放', pause: '暂停', 'toggle-playback': '播放／暂停', 'next-track': '下一项', 'previous-track': '上一项',
  'volume-up': '音量增加', 'volume-down': '音量减少', 'seek-forward': '快进 10 秒', 'seek-backward': '快退 10 秒'
};

export type ShortcutMap = Partial<Record<Action, string>>;

const keyNames: Record<string, string> = {
  ' ': 'Space', Escape: 'Esc', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  PageUp: 'PageUp', PageDown: 'PageDown', Enter: 'Enter', Backspace: 'Backspace', Delete: 'Delete'
};

export function shortcutFromKeyboardEvent(event: KeyboardEvent): string | undefined {
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return undefined;
  const modifiers = [event.ctrlKey ? 'Ctrl' : '', event.altKey ? 'Alt' : '', event.shiftKey ? 'Shift' : '', event.metaKey ? 'Command' : ''].filter(Boolean);
  if (!modifiers.length) return undefined;
  const key = keyNames[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key);
  return [...modifiers, key].join('+');
}
