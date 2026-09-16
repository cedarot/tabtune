export function createId(prefix = 'tabtune'): string {
  const values = new Uint32Array(4);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(values);
  else values[0] = Math.floor(Math.random() * 0xffffffff);
  return `${prefix}-${Date.now().toString(36)}-${Array.from(values, (value) => value.toString(36)).join('')}`;
}
