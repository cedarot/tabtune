import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('built extension contract', () => {
  it('contains a MV3 manifest with all global control commands', () => {
    expect(existsSync('dist/manifest.json')).toBe(true);
    const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8')) as { manifest_version: number; background: { service_worker: string }; action: { default_popup: string; default_icon?: Record<string, string> }; icons?: Record<string, string>; host_permissions?: string[]; optional_host_permissions?: string[]; options_ui: { page: string }; content_scripts?: Array<{ js?: string[]; world?: string; run_at?: string }>; commands: Record<string, { global?: boolean; suggested_key?: { default?: string; mac?: string } }> };
    expect(manifest.manifest_version).toBe(3);
    for (const path of [manifest.background.service_worker, manifest.action.default_popup, manifest.options_ui.page, 'content/index.js', 'content/page-hook.js']) expect(existsSync(`dist/${path}`)).toBe(true);
    expect(manifest.action.default_icon).toEqual(expect.objectContaining({ '16': 'icons/icon16.png', '32': 'icons/icon32.png' }));
    expect(manifest.host_permissions).toEqual(['http://*/*', 'https://*/*']);
    expect(manifest.optional_host_permissions).toBeUndefined();
    expect(manifest.content_scripts).toEqual(expect.arrayContaining([
      expect.objectContaining({ js: ['content/page-hook.js'], world: 'MAIN', run_at: 'document_start', all_frames: true }),
      expect.objectContaining({ js: ['content/index.js'], run_at: 'document_start', all_frames: true })
    ]));
    expect(readFileSync(`dist/${manifest.background.service_worker}`, 'utf8')).not.toMatch(/^import\s/m);
    for (const name of ['toggle-playback', 'next-track', 'previous-track', 'volume-up', 'volume-down', 'seek-forward', 'seek-backward']) expect(manifest.commands[name]?.global).toBe(true);
    expect(manifest.commands['previous-track']?.suggested_key).toEqual({ default: 'Ctrl+Shift+Comma', mac: 'Command+Shift+Comma' });
    expect(manifest.commands['next-track']?.suggested_key).toEqual({ default: 'Ctrl+Shift+Period', mac: 'Command+Shift+Period' });
    expect(manifest.commands.play).toBeUndefined();
    expect(manifest.commands.pause).toBeUndefined();
    expect(Object.keys(manifest.commands)).toEqual(['toggle-playback', 'previous-track', 'next-track', 'volume-up', 'volume-down', 'seek-forward', 'seek-backward']);
    expect(manifest.icons).toEqual(expect.objectContaining({ '16': 'icons/icon16.png', '32': 'icons/icon32.png', '48': 'icons/icon48.png', '128': 'icons/icon128.png' }));
    for (const path of Object.values(manifest.icons ?? {})) expect(existsSync(`dist/${path}`)).toBe(true);
  });
});
