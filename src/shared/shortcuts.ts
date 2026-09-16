import type { Action } from './types';

export const shortcutActions: Action[] = [
  'play', 'pause', 'toggle-playback', 'next-track', 'previous-track',
  'volume-up', 'volume-down', 'seek-forward', 'seek-backward'
];

export const shortcutLabels: Record<Action, string> = {
  play: '播放', pause: '暂停', 'toggle-playback': '播放／暂停', 'next-track': '下一项', 'previous-track': '上一项',
  'volume-up': '音量增加', 'volume-down': '音量减少', 'seek-forward': '快进 10 秒', 'seek-backward': '快退 10 秒'
};
