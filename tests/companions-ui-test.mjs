import assert from 'node:assert/strict';
import * as companionsUiModule from '../src/companions-ui.js';

// Basic smoke test to ensure the UI module loads without throwing.
assert.ok(companionsUiModule, 'src/companions-ui.js should export something');
