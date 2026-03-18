import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { handleUIAction } from '../src/handlers/ui-handler.js';

function createBaseState(overrides = {}) {
  return {
    phase: 'exploration',
    player: {
      name: 'Hero',
      classId: 'warrior',
      level: 3,
      xp: 120,
      hp: 42,
      maxHp: 50,
      mp: 10,
      maxMp: 15,
      atk: 12,
      def: 9,
      spd: 7,
      int: 4,
      gold: 33,
      equipment: { weapon: null, armor: null, accessory: null },
      statusEffects: [],
    },
    log: [],
    ...overrides,
  };
}

test('VIEW_STATS opens the character sheet phase from exploration', () => {
  const state = createBaseState();
  const next = handleUIAction(state, { type: 'VIEW_STATS' });

  assert.ok(next);
  assert.equal(next.phase, 'stats');
  assert.equal(next.previousPhase, 'exploration');
});

test('CLOSE_STATS returns to the previous phase', () => {
  const state = createBaseState({ phase: 'stats', previousPhase: 'exploration' });
  const next = handleUIAction(state, { type: 'CLOSE_STATS' });

  assert.ok(next);
  assert.equal(next.phase, 'exploration');
});

test('render source wires character labels, character-sheet content, and talents scroll reset', () => {
  const src = readFileSync('src/render.js', 'utf8');

  assert.ok(src.includes('Character 👤'), 'exploration character action should be clearly labeled');
  assert.ok(src.includes('Statistics 📈'), 'statistics dashboard action should remain separately labeled');
  assert.ok(src.includes('<h2>Character Sheet</h2>'), 'stats phase should render a character sheet');
  assert.ok(src.includes('${renderEquipmentSummaryRows(player)}'), 'character sheet should include equipment summary');
  assert.ok(src.includes('${renderStatusEffectsRow(player.statusEffects ?? [])}'), 'character sheet should include status effects');
  assert.ok(src.includes('${renderCompactCharacterSummary(state.player)}'), 'exploration HUD should include compact character summary');
  assert.ok(src.includes('<div>ATK</div>'), 'compact summary should include ATK');
  assert.ok(src.includes('<div>DEF</div>'), 'compact summary should include DEF');
  assert.ok(src.includes('<div>SPD</div>'), 'compact summary should include SPD');
  assert.ok(src.includes("if (state.phase === 'talents')"), 'talents phase should be present');
  assert.match(
    src,
    /if \(state\.phase === 'talents'\)[\s\S]*window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/,
    'opening talents should reset viewport to top',
  );
});
