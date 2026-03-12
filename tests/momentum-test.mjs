/**
 * Tests for Momentum/Overdrive System
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  MAX_MOMENTUM,
  MOMENTUM_SOURCES,
  ACTION_TYPES,
  OVERDRIVE_ABILITIES,
  createMomentumState,
  calculateMomentumGain,
  addMomentum,
  consumeOverdrive,
  applyMomentumDecay,
  getOverdriveAbility,
  calculateOverdriveDamage,
  calculateOverdriveHealing,
  getMomentumPercent,
  getMomentumLevel,
  canUseOverdrive,
  getActionVariety,
} from '../src/momentum.js';

import {
  renderMomentumGauge,
  renderMomentumIndicator,
  renderOverdriveButton,
  renderOverdriveTooltip,
  renderMomentumGainNotification,
  renderVarietyBonus,
  renderMomentumLogEntry,
  renderOverdriveLogEntry,
  getMomentumStyles,
} from '../src/momentum-ui.js';

// ============ CONSTANTS TESTS ============

describe('Constants', () => {
  test('MAX_MOMENTUM is 100', () => {
    assert.strictEqual(MAX_MOMENTUM, 100);
  });

  test('MOMENTUM_SOURCES has all required sources', () => {
    assert.ok(MOMENTUM_SOURCES.BASIC_ATTACK > 0);
    assert.ok(MOMENTUM_SOURCES.SKILL_USE > 0);
    assert.ok(MOMENTUM_SOURCES.WEAKNESS_HIT > 0);
    assert.ok(MOMENTUM_SOURCES.SHIELD_BREAK > 0);
    assert.ok(MOMENTUM_SOURCES.CRITICAL_HIT > 0);
    assert.ok(MOMENTUM_SOURCES.VARIETY_BONUS > 0);
  });

  test('ACTION_TYPES has all required types', () => {
    assert.ok(ACTION_TYPES.ATTACK);
    assert.ok(ACTION_TYPES.SKILL);
    assert.ok(ACTION_TYPES.DEFEND);
    assert.ok(ACTION_TYPES.ITEM);
    assert.ok(ACTION_TYPES.SPECIAL);
  });

  test('OVERDRIVE_ABILITIES has class abilities', () => {
    assert.ok(OVERDRIVE_ABILITIES.warrior);
    assert.ok(OVERDRIVE_ABILITIES.mage);
    assert.ok(OVERDRIVE_ABILITIES.ranger);
    assert.ok(OVERDRIVE_ABILITIES.healer);
    assert.ok(OVERDRIVE_ABILITIES.default);
  });
});

// ============ CREATE MOMENTUM STATE TESTS ============

describe('createMomentumState', () => {
  test('returns initial state with zero momentum', () => {
    const state = createMomentumState();
    assert.strictEqual(state.current, 0);
    assert.strictEqual(state.max, MAX_MOMENTUM);
    assert.strictEqual(state.overdriveReady, false);
  });

  test('returns empty lastActions array', () => {
    const state = createMomentumState();
    assert.ok(Array.isArray(state.lastActions));
    assert.strictEqual(state.lastActions.length, 0);
  });

  test('initializes turnsUntilDecay', () => {
    const state = createMomentumState();
    assert.strictEqual(state.turnsUntilDecay, 3);
  });
});

// ============ CALCULATE MOMENTUM GAIN TESTS ============

describe('calculateMomentumGain', () => {
  test('returns base gain for basic attack', () => {
    const gain = calculateMomentumGain(ACTION_TYPES.ATTACK);
    assert.strictEqual(gain, MOMENTUM_SOURCES.BASIC_ATTACK);
  });

  test('returns base gain for skill use', () => {
    const gain = calculateMomentumGain(ACTION_TYPES.SKILL);
    assert.strictEqual(gain, MOMENTUM_SOURCES.SKILL_USE);
  });

  test('adds bonus for weakness hit', () => {
    const gain = calculateMomentumGain(ACTION_TYPES.ATTACK, { hitWeakness: true });
    assert.strictEqual(gain, MOMENTUM_SOURCES.BASIC_ATTACK + MOMENTUM_SOURCES.WEAKNESS_HIT);
  });

  test('adds bonus for critical hit', () => {
    const gain = calculateMomentumGain(ACTION_TYPES.ATTACK, { criticalHit: true });
    assert.strictEqual(gain, MOMENTUM_SOURCES.BASIC_ATTACK + MOMENTUM_SOURCES.CRITICAL_HIT);
  });

  test('adds bonus for breaking shield', () => {
    const gain = calculateMomentumGain(ACTION_TYPES.ATTACK, { brokeShield: true });
    assert.strictEqual(gain, MOMENTUM_SOURCES.BASIC_ATTACK + MOMENTUM_SOURCES.SHIELD_BREAK);
  });

  test('adds variety bonus for different action type', () => {
    const state = { lastActions: [ACTION_TYPES.ATTACK] };
    const gain = calculateMomentumGain(ACTION_TYPES.SKILL, {}, state);
    assert.strictEqual(gain, MOMENTUM_SOURCES.SKILL_USE + MOMENTUM_SOURCES.VARIETY_BONUS);
  });

  test('no variety bonus for same action type', () => {
    const state = { lastActions: [ACTION_TYPES.ATTACK] };
    const gain = calculateMomentumGain(ACTION_TYPES.ATTACK, {}, state);
    assert.strictEqual(gain, MOMENTUM_SOURCES.BASIC_ATTACK);
  });

  test('stacks multiple bonuses', () => {
    const gain = calculateMomentumGain(ACTION_TYPES.ATTACK, {
      hitWeakness: true,
      criticalHit: true,
    });
    const expected = MOMENTUM_SOURCES.BASIC_ATTACK +
      MOMENTUM_SOURCES.WEAKNESS_HIT +
      MOMENTUM_SOURCES.CRITICAL_HIT;
    assert.strictEqual(gain, expected);
  });
});

// ============ ADD MOMENTUM TESTS ============

describe('addMomentum', () => {
  test('adds momentum to current', () => {
    const state = createMomentumState();
    const newState = addMomentum(state, 20, ACTION_TYPES.ATTACK);
    assert.strictEqual(newState.current, 20);
  });

  test('caps at max momentum', () => {
    const state = { ...createMomentumState(), current: 90 };
    const newState = addMomentum(state, 20, ACTION_TYPES.ATTACK);
    assert.strictEqual(newState.current, MAX_MOMENTUM);
  });

  test('sets overdriveReady when max reached', () => {
    const state = { ...createMomentumState(), current: 90 };
    const newState = addMomentum(state, 20, ACTION_TYPES.ATTACK);
    assert.strictEqual(newState.overdriveReady, true);
  });

  test('tracks action in lastActions', () => {
    const state = createMomentumState();
    const newState = addMomentum(state, 10, ACTION_TYPES.SKILL);
    assert.ok(newState.lastActions.includes(ACTION_TYPES.SKILL));
  });

  test('limits lastActions to 5', () => {
    let state = createMomentumState();
    for (let i = 0; i < 10; i++) {
      state = addMomentum(state, 5, ACTION_TYPES.ATTACK);
    }
    assert.strictEqual(state.lastActions.length, 5);
  });

  test('resets turnsUntilDecay', () => {
    const state = { ...createMomentumState(), turnsUntilDecay: 0 };
    const newState = addMomentum(state, 10, ACTION_TYPES.ATTACK);
    assert.strictEqual(newState.turnsUntilDecay, 3);
  });
});

// ============ CONSUME OVERDRIVE TESTS ============

describe('consumeOverdrive', () => {
  test('resets momentum to zero', () => {
    const state = { ...createMomentumState(), current: 100, overdriveReady: true };
    const newState = consumeOverdrive(state);
    assert.strictEqual(newState.current, 0);
  });

  test('sets overdriveReady to false', () => {
    const state = { ...createMomentumState(), current: 100, overdriveReady: true };
    const newState = consumeOverdrive(state);
    assert.strictEqual(newState.overdriveReady, false);
  });

  test('clears lastActions', () => {
    const state = {
      ...createMomentumState(),
      current: 100,
      overdriveReady: true,
      lastActions: [ACTION_TYPES.ATTACK, ACTION_TYPES.SKILL],
    };
    const newState = consumeOverdrive(state);
    assert.strictEqual(newState.lastActions.length, 0);
  });

  test('does nothing if overdrive not ready', () => {
    const state = { ...createMomentumState(), current: 50, overdriveReady: false };
    const newState = consumeOverdrive(state);
    assert.strictEqual(newState.current, 50);
  });
});

// ============ APPLY MOMENTUM DECAY TESTS ============

describe('applyMomentumDecay', () => {
  test('resets decay timer when action taken', () => {
    const state = { ...createMomentumState(), turnsUntilDecay: 1 };
    const newState = applyMomentumDecay(state, true);
    assert.strictEqual(newState.turnsUntilDecay, 3);
  });

  test('decrements decay timer when no action', () => {
    const state = { ...createMomentumState(), turnsUntilDecay: 3 };
    const newState = applyMomentumDecay(state, false);
    assert.strictEqual(newState.turnsUntilDecay, 2);
  });

  test('decays momentum after timer reaches zero', () => {
    const state = { ...createMomentumState(), current: 50, turnsUntilDecay: 0 };
    const newState = applyMomentumDecay(state, false);
    assert.ok(newState.current < 50);
  });

  test('decay is 10% of current', () => {
    const state = { ...createMomentumState(), current: 50, turnsUntilDecay: 0 };
    const newState = applyMomentumDecay(state, false);
    assert.strictEqual(newState.current, 45); // 50 - ceil(50 * 0.1)
  });

  test('momentum cannot go below zero', () => {
    const state = { ...createMomentumState(), current: 5, turnsUntilDecay: 0 };
    const newState = applyMomentumDecay(state, false);
    assert.ok(newState.current >= 0);
  });
});

// ============ GET OVERDRIVE ABILITY TESTS ============

describe('getOverdriveAbility', () => {
  test('returns warrior ability for warrior class', () => {
    const ability = getOverdriveAbility('warrior');
    assert.strictEqual(ability.id, 'warriors-fury');
  });

  test('returns mage ability for mage class', () => {
    const ability = getOverdriveAbility('mage');
    assert.strictEqual(ability.id, 'arcane-storm');
  });

  test('returns default for unknown class', () => {
    const ability = getOverdriveAbility('unknown');
    assert.strictEqual(ability.id, 'limit-break');
  });

  test('is case insensitive', () => {
    const ability = getOverdriveAbility('WARRIOR');
    assert.strictEqual(ability.id, 'warriors-fury');
  });
});

// ============ CALCULATE OVERDRIVE DAMAGE TESTS ============

describe('calculateOverdriveDamage', () => {
  test('calculates multi-hit damage correctly', () => {
    const ability = OVERDRIVE_ABILITIES.warrior;
    const attacker = { atk: 20, level: 5 };
    const defender = { def: 10 };
    const result = calculateOverdriveDamage(ability, attacker, defender);
    assert.ok(result.totalDamage > 0);
    assert.strictEqual(result.hits, 3);
    assert.strictEqual(result.totalDamage, result.damagePerHit * result.hits);
  });

  test('returns zero for heal abilities', () => {
    const ability = OVERDRIVE_ABILITIES.healer;
    const result = calculateOverdriveDamage(ability, { atk: 20 }, { def: 10 });
    assert.strictEqual(result.totalDamage, 0);
  });

  test('minimum damage is 1 per hit', () => {
    const ability = { type: 'physical', hits: 1, powerPerHit: 1 };
    const result = calculateOverdriveDamage(ability, { atk: 1, level: 1 }, { def: 100 });
    assert.strictEqual(result.damagePerHit, 1);
  });
});

// ============ CALCULATE OVERDRIVE HEALING TESTS ============

describe('calculateOverdriveHealing', () => {
  test('calculates heal amount based on percent', () => {
    const ability = OVERDRIVE_ABILITIES.healer;
    const target = { hp: 50, maxHp: 100 };
    const result = calculateOverdriveHealing(ability, target);
    assert.strictEqual(result.healAmount, 100); // 100% of 100 maxHp
  });

  test('returns cleansesStatus flag', () => {
    const ability = OVERDRIVE_ABILITIES.healer;
    const result = calculateOverdriveHealing(ability, { maxHp: 100 });
    assert.strictEqual(result.cleansesStatus, true);
  });

  test('returns zero for non-heal abilities', () => {
    const ability = OVERDRIVE_ABILITIES.warrior;
    const result = calculateOverdriveHealing(ability, { maxHp: 100 });
    assert.strictEqual(result.healAmount, 0);
  });
});

// ============ GET MOMENTUM PERCENT TESTS ============

describe('getMomentumPercent', () => {
  test('returns 0 for null state', () => {
    assert.strictEqual(getMomentumPercent(null), 0);
  });

  test('returns correct percentage', () => {
    const state = { current: 50, max: 100 };
    assert.strictEqual(getMomentumPercent(state), 50);
  });

  test('returns 100 when full', () => {
    const state = { current: 100, max: 100 };
    assert.strictEqual(getMomentumPercent(state), 100);
  });
});

// ============ GET MOMENTUM LEVEL TESTS ============

describe('getMomentumLevel', () => {
  test('returns empty for 0%', () => {
    assert.strictEqual(getMomentumLevel({ current: 0, max: 100 }), 'empty');
  });

  test('returns low for 25%', () => {
    assert.strictEqual(getMomentumLevel({ current: 25, max: 100 }), 'low');
  });

  test('returns medium for 50%', () => {
    assert.strictEqual(getMomentumLevel({ current: 50, max: 100 }), 'medium');
  });

  test('returns high for 75%', () => {
    assert.strictEqual(getMomentumLevel({ current: 75, max: 100 }), 'high');
  });

  test('returns full for 100%', () => {
    assert.strictEqual(getMomentumLevel({ current: 100, max: 100 }), 'full');
  });
});

// ============ CAN USE OVERDRIVE TESTS ============

describe('canUseOverdrive', () => {
  test('returns false for null state', () => {
    assert.strictEqual(canUseOverdrive(null), false);
  });

  test('returns false when not ready', () => {
    assert.strictEqual(canUseOverdrive({ overdriveReady: false }), false);
  });

  test('returns true when ready', () => {
    assert.strictEqual(canUseOverdrive({ overdriveReady: true }), true);
  });
});

// ============ GET ACTION VARIETY TESTS ============

describe('getActionVariety', () => {
  test('returns 0 for empty actions', () => {
    assert.strictEqual(getActionVariety({ lastActions: [] }), 0);
  });

  test('returns 1 for all unique actions', () => {
    const variety = getActionVariety({
      lastActions: [ACTION_TYPES.ATTACK, ACTION_TYPES.SKILL, ACTION_TYPES.DEFEND, ACTION_TYPES.ITEM],
    });
    assert.strictEqual(variety, 1);
  });

  test('returns 0.5 for half unique actions', () => {
    const variety = getActionVariety({
      lastActions: [ACTION_TYPES.ATTACK, ACTION_TYPES.ATTACK, ACTION_TYPES.SKILL, ACTION_TYPES.SKILL],
    });
    assert.strictEqual(variety, 0.5);
  });
});

// ============ UI RENDERING TESTS ============

describe('renderMomentumGauge', () => {
  test('returns empty for null state', () => {
    assert.strictEqual(renderMomentumGauge(null), '');
  });

  test('returns HTML with momentum info', () => {
    const state = createMomentumState();
    const html = renderMomentumGauge(state);
    assert.ok(html.includes('momentum-gauge'));
    assert.ok(html.includes('Momentum'));
  });

  test('shows overdrive indicator when ready', () => {
    const state = { ...createMomentumState(), current: 100, overdriveReady: true };
    const html = renderMomentumGauge(state, 'warrior');
    assert.ok(html.includes('overdrive-indicator'));
    assert.ok(html.includes('Warrior') && html.includes('Fury'));
  });
});

describe('renderMomentumIndicator', () => {
  test('returns empty for null state', () => {
    assert.strictEqual(renderMomentumIndicator(null), '');
  });

  test('returns compact indicator', () => {
    const state = { current: 50, max: 100 };
    const html = renderMomentumIndicator(state);
    assert.ok(html.includes('momentum-indicator'));
    assert.ok(html.includes('50%'));
  });
});

describe('renderOverdriveButton', () => {
  test('returns disabled button when not ready', () => {
    const state = createMomentumState();
    const html = renderOverdriveButton(state, 'warrior');
    assert.ok(html.includes('disabled'));
  });

  test('returns active button when ready', () => {
    const state = { ...createMomentumState(), current: 100, overdriveReady: true };
    const html = renderOverdriveButton(state, 'warrior');
    assert.ok(html.includes('ready'));
    assert.ok(!html.includes(' disabled'));
  });
});

describe('renderOverdriveTooltip', () => {
  test('includes ability name and description', () => {
    const html = renderOverdriveTooltip('warrior');
    assert.ok(html.includes('Warrior') && html.includes('Fury'));
    assert.ok(html.includes('3-hit combo'));
  });
});

describe('renderMomentumGainNotification', () => {
  test('returns empty for zero gain', () => {
    assert.strictEqual(renderMomentumGainNotification(0), '');
  });

  test('shows gain amount', () => {
    const html = renderMomentumGainNotification(15, 'critical hit');
    assert.ok(html.includes('+15'));
    assert.ok(html.includes('critical hit'));
  });
});

describe('renderVarietyBonus', () => {
  test('returns empty for no variety', () => {
    const html = renderVarietyBonus({ lastActions: [] });
    assert.strictEqual(html, '');
  });

  test('shows stars for variety', () => {
    const html = renderVarietyBonus({
      lastActions: [ACTION_TYPES.ATTACK, ACTION_TYPES.SKILL, ACTION_TYPES.DEFEND, ACTION_TYPES.ITEM],
    });
    assert.ok(html.includes('variety-bonus'));
    assert.ok(html.includes('\u2605')); // filled star
  });
});

describe('renderMomentumLogEntry', () => {
  test('returns log entry object', () => {
    const entry = renderMomentumLogEntry(10, 'attack');
    assert.strictEqual(entry.type, 'momentum');
    assert.ok(entry.message.includes('10'));
    assert.strictEqual(entry.amount, 10);
  });
});

describe('renderOverdriveLogEntry', () => {
  test('returns log entry with ability name', () => {
    const entry = renderOverdriveLogEntry('mage');
    assert.strictEqual(entry.type, 'overdrive');
    assert.ok(entry.message.includes('Arcane Storm'));
  });
});

describe('getMomentumStyles', () => {
  test('returns CSS string', () => {
    const css = getMomentumStyles();
    assert.ok(css.includes('.momentum-gauge'));
    assert.ok(css.includes('.overdrive-button'));
  });
});

// ============ SECURITY TESTS ============

describe('Security - No forbidden words', () => {
  const forbiddenWords = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

  test('momentum.js has no forbidden words', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('./src/momentum.js', 'utf8').toLowerCase();
    for (const word of forbiddenWords) {
      assert.ok(!content.includes(word), `Found forbidden word: ${word}`);
    }
  });

  test('momentum-ui.js has no forbidden words', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('./src/momentum-ui.js', 'utf8').toLowerCase();
    for (const word of forbiddenWords) {
      assert.ok(!content.includes(word), `Found forbidden word: ${word}`);
    }
  });
});
