import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('built extension contract', () => {
  it('contains a MV3 manifest with all global control commands', () => {
    expect(existsSync('dist/manifest.json')).toBe(true);
    const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8')) as { manifest_version: number; background: { service_worker: string }; action: { default_popup: string }; options_ui: { page: string }; commands: Record<string, { global?: boolean }> };
    expect(manifest.manifest_version).toBe(3);
    for (const path of [manifest.background.service_worker, manifest.action.default_popup, manifest.options_ui.page, 'content/index.js']) expect(existsSync(`dist/${path}`)).toBe(true);
    for (const name of ['play', 'pause', 'toggle-playback', 'next-track', 'previous-track', 'volume-up', 'volume-down', 'seek-forward', 'seek-backward']) expect(manifest.commands[name]?.global).toBe(true);
  });
});
