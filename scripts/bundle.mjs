import { build } from 'esbuild';

await build({ entryPoints: ['src/content/index.ts'], bundle: true, format: 'iife', outfile: 'dist/content/index.js', sourcemap: true, platform: 'browser' });
await build({ entryPoints: ['src/content/page-hook.ts'], bundle: true, format: 'iife', outfile: 'dist/content/page-hook.js', sourcemap: true, platform: 'browser' });
await build({ entryPoints: ['src/background/index.ts'], bundle: true, format: 'esm', outfile: 'dist/background/index.js', sourcemap: true, platform: 'browser' });
await build({ entryPoints: ['src/popup/popup.ts'], bundle: true, format: 'esm', outfile: 'dist/popup/popup.js', sourcemap: true, platform: 'browser' });
await build({ entryPoints: ['src/options/options.ts'], bundle: true, format: 'esm', outfile: 'dist/options/options.js', sourcemap: true, platform: 'browser' });
console.log('Bundled background, content, popup, and options entry points.');
