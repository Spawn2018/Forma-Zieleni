const MARKER = /^<!-- FZ:AUTO:(START|END) ([a-z0-9-]+) -->/;

export function applyRegions(text, renderers) {
  if (typeof text !== 'string') throw new Error('README text must be a string');
  if (text.includes('\r')) throw new Error('README must use LF');
  const pieces = [];
  const seen = new Set();
  let open = null;
  let cursor = 0;
  let index = 0;
  while (index < text.length) {
    const marker = text.indexOf('<!-- FZ:AUTO:', index);
    if (marker === -1) break;
    const match = MARKER.exec(text.slice(marker));
    if (!match) throw new Error('malformed FZ:AUTO marker');
    const [token, kind, key] = match;
    if (kind === 'START') {
      if (open) throw new Error(`nested FZ:AUTO marker ${key}`);
      if (seen.has(key)) throw new Error(`duplicate FZ:AUTO marker ${key}`);
      if (!Object.hasOwn(renderers, key)) throw new Error(`unknown FZ:AUTO region ${key}`);
      pieces.push(text.slice(cursor, marker + token.length));
      open = key;
      index = marker + token.length;
      continue;
    }
    if (!open) throw new Error(`missing FZ:AUTO start for ${key}`);
    if (open !== key) throw new Error(`mismatched FZ:AUTO end ${key}`);
    const interior = renderers[key]();
    if (typeof interior !== 'string' || interior.includes('<!-- FZ:AUTO:')) {
      throw new Error(`invalid FZ:AUTO output ${key}`);
    }
    pieces.push(interior, token);
    seen.add(key);
    open = null;
    cursor = marker + token.length;
    index = cursor;
  }
  if (open) throw new Error(`missing FZ:AUTO end for ${open}`);
  pieces.push(text.slice(cursor));
  return pieces.join('');
}
