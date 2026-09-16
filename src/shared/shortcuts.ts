import type { Action } from './types';

export const shortcutActions: Action[] = [
  'play', 'pause', 'next-track', 'previous-track',
  'volume-up', 'volume-down', 'seek-forward', 'seek-backward'
];

export const shortcutLabels: Record<Action, string> = {
  play: 'Play', pause: 'Pause', 'next-track': 'Next track', 'previous-track': 'Previous track',
  'volume-up': 'Increase volume', 'volume-down': 'Decrease volume', 'seek-forward': 'Seek forward 10s', 'seek-backward': 'Seek backward 10s'
};
