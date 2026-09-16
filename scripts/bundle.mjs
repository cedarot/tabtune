import { build } from 'esbuild';

await build({ entryPoints: ['src/content/index.ts'], bundle: true, format: 'iife', outfile: 'dist/content/index.js', sourcemap: true, platform: 'browser' });
await build({ entryPoints: ['src/popup/popup.ts'], bundle: true, format: 'esm', outfile: 'dist/popup/popup.js', sourcemap: true, platform: 'browser' });
console.log('Bundled content and popup entry points.');
