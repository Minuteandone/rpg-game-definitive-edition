import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const renderSource = readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');

assert.match(
  renderSource,
  /querySelector\('\.world-event-dismiss-btn'\)[\s\S]*dispatch\s*\(\s*\{\s*type:\s*'DISMISS_WORLD_EVENT'/,
  'Expected exploration render to wire .world-event-dismiss-btn to DISMISS_WORLD_EVENT dispatch',
);

console.log('world-event-wiring-render-test passed');
