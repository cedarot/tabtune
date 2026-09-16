import { cp, mkdir, rm } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await cp('src/manifest.json', 'dist/manifest.json');
await cp('src/popup/popup.html', 'dist/popup/popup.html');
await cp('src/popup/popup.css', 'dist/popup/popup.css');
await mkdir('dist/icons', { recursive: true });
await cp('src/icons', 'dist/icons', { recursive: true });
console.log('Built unpacked extension in dist/');
