import fs from 'node:fs';
import path from 'node:path';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getJsFiles(rootDir) {
  const results = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

function getMaxLeadingSpaces(text) {
  let max = 0;
  for (const line of text.split('\n')) {
    let i = 0;
    while (i < line.length && line[i] === ' ') i += 1;
    if (i > max) max = i;
  }
  return max;
}

const SRC_DIR = path.join('src');
const jsFiles = getJsFiles(SRC_DIR);

// Tokens associated with obfuscation or covert channels that should
// never appear in production source files. This complements the
// repo's explicit ban on eval / Function / atob / btoa, etc.
const BANNED_TOKENS = [
  'eval(',
  'new Function',
  'Function(',
  'Function (',
  'atob(',
  'btoa(',
  'unescape(',
];

let filesChecked = 0;

for (const filePath of jsFiles) {
  const buf = fs.readFileSync(filePath);
  const text = buf.toString('utf8');

  const totalBytes = buf.length || 1;
  let spaceCount = 0;
  for (const byte of buf) {
    if (byte === 0x20) spaceCount += 1;
  }
  const spaceRatio = spaceCount / totalBytes;
  const maxLeadingSpaces = getMaxLeadingSpaces(text);

  // Thresholds intentionally generous but sufficient to catch
  // pathological padding or whitespace-based steganography.
  assert(
    spaceRatio < 0.6,
    `${filePath}: spaceRatio too high: ${spaceRatio}`,
  );
  assert(
    maxLeadingSpaces <= 80,
    `${filePath}: maxLeadingSpaces too high: ${maxLeadingSpaces}`,
  );

  for (const token of BANNED_TOKENS) {
    assert(
      !text.includes(token),
      `${filePath}: disallowed token detected: ${JSON.stringify(token)}`,
    );
  }

  filesChecked += 1;
}

console.log(`[whitespace-guard-test] Checked ${filesChecked} JS files under src/`);
console.log('[whitespace-guard-test] OK');
