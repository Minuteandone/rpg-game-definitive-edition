/**
 * Companion Loyalty Events Tests
 * Owner: Claude Opus 4.6
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  LOYALTY_TIERS,
  getLoyaltyTier,
  getEventText,
  COMPANION_EVENT_TEXT,
  LOYALTY_EFFECTS,
  getLoyaltyEffects,
  detectThresholdCrossings,
  processLoyaltyEvents,
  adjustLoyaltyWithEvents,
  getCompanionLoyaltySummary,
} from '../src/companion-loyalty-events.js';

const counts = { passed: 0, failed: 0 };
const countedTest = (name, fn) => test(name, async (t) => {
  try { await fn(t); counts.passed += 1; }
  catch (err) { counts.failed += 1; throw err; }
});
process.on('exit', () => {
  console.log(`Companion loyalty events tests - passed: ${counts.passed}, failed: ${counts.failed}`);
});

// ---------- helpers ----------
function makeState(companions = []) {
  return {
    companions,
    maxCompanions: 2,
    log: [],
    journal: { entries: [], unreadCount: 0, lastViewedTurn: 0 },
  };
}

function makeCompanion(overrides = {}) {
  return {
    id: 'fenris',
    name: 'Fenris',
    class: 'Warrior',
    level: 2,
    hp: 45,
    maxHp: 45,
    mp: 10,
    maxMp: 10,
    attack: 12,
    defense: 10,
    speed: 8,
    skills: [],
    alive: true,
    loyalty: 50,
    ...overrides,
  };
}

// ============================================================
// LOYALTY_TIERS
// ============================================================
describe('LOYALTY_TIERS', () => {
  countedTest('has 6 tiers in ascending threshold order', () => {
    assert.strictEqual(LOYALTY_TIERS.length, 6);
    for (let i = 1; i < LOYALTY_TIERS.length; i++) {
      assert.ok(LOYALTY_TIERS[i].threshold > LOYALTY_TIERS[i - 1].threshold);
    }
  });

  countedTest('first tier is Abandoned at 0', () => {
    assert.strictEqual(LOYALTY_TIERS[0].name, 'Abandoned');
    assert.strictEqual(LOYALTY_TIERS[0].threshold, 0);
  });

  countedTest('last tier is Soulbound at 100', () => {
    assert.strictEqual(LOYALTY_TIERS[5].name, 'Soulbound');
    assert.strictEqual(LOYALTY_TIERS[5].threshold, 100);
  });
});

// ============================================================
// getLoyaltyTier
// ============================================================
describe('getLoyaltyTier', () => {
  countedTest('returns Abandoned for loyalty 0', () => {
    assert.strictEqual(getLoyaltyTier(0).name, 'Abandoned');
  });

  countedTest('returns Discontent for loyalty 10', () => {
    assert.strictEqual(getLoyaltyTier(10).name, 'Discontent');
  });

  countedTest('returns Neutral for loyalty 25', () => {
    assert.strictEqual(getLoyaltyTier(25).name, 'Neutral');
  });

  countedTest('returns Friendly for loyalty 50', () => {
    assert.strictEqual(getLoyaltyTier(50).name, 'Friendly');
  });

  countedTest('returns Devoted for loyalty 75', () => {
    assert.strictEqual(getLoyaltyTier(75).name, 'Devoted');
  });

  countedTest('returns Soulbound for loyalty 100', () => {
    assert.strictEqual(getLoyaltyTier(100).name, 'Soulbound');
  });

  countedTest('returns Friendly for loyalty 74 (just below Devoted)', () => {
    assert.strictEqual(getLoyaltyTier(74).name, 'Friendly');
  });

  countedTest('returns Abandoned for non-number input', () => {
    assert.strictEqual(getLoyaltyTier(undefined).name, 'Abandoned');
    assert.strictEqual(getLoyaltyTier(null).name, 'Abandoned');
    assert.strictEqual(getLoyaltyTier('abc').name, 'Abandoned');
  });
});

// ============================================================
// getEventText
// ============================================================
describe('getEventText', () => {
  countedTest('returns personalised text for fenris', () => {
    const text = getEventText('fenris', 'Friendly', 'Fenris');
    assert.ok(text.includes('Fenris'));
    assert.ok(text.includes('campfire'));
  });

  countedTest('returns personalised text for lyra', () => {
    const text = getEventText('lyra', 'Soulbound', 'Lyra');
    assert.ok(text.includes('Lyra'));
    assert.ok(text.includes('sigil'));
  });

  countedTest('uses default text for unknown companion', () => {
    const text = getEventText('unknown_npc', 'Friendly', 'Bob');
    assert.ok(text.includes('Bob'));
    assert.ok(text.includes('personal story'));
  });

  countedTest('replaces {name} placeholder in all instances', () => {
    const text = getEventText('fenris', 'Abandoned', 'Fenris');
    assert.ok(!text.includes('{name}'));
    assert.ok(text.includes('Fenris'));
  });
});

// ============================================================
// LOYALTY_EFFECTS
// ============================================================
describe('LOYALTY_EFFECTS', () => {
  countedTest('Abandoned causes companion to leave', () => {
    assert.strictEqual(LOYALTY_EFFECTS.Abandoned.leaves, true);
  });

  countedTest('Discontent has -1 attack modifier', () => {
    assert.strictEqual(LOYALTY_EFFECTS.Discontent.attackMod, -1);
  });

  countedTest('Neutral has no modifiers', () => {
    assert.strictEqual(LOYALTY_EFFECTS.Neutral.attackMod, 0);
    assert.strictEqual(LOYALTY_EFFECTS.Neutral.defenseMod, 0);
  });

  countedTest('Devoted unlocks ability', () => {
    assert.strictEqual(LOYALTY_EFFECTS.Devoted.unlocksAbility, true);
    assert.strictEqual(LOYALTY_EFFECTS.Devoted.attackMod, 2);
  });

  countedTest('Soulbound has loyalty floor of 25', () => {
    assert.strictEqual(LOYALTY_EFFECTS.Soulbound.loyaltyFloor, 25);
    assert.strictEqual(LOYALTY_EFFECTS.Soulbound.attackMod, 3);
    assert.strictEqual(LOYALTY_EFFECTS.Soulbound.defenseMod, 2);
  });
});

// ============================================================
// getLoyaltyEffects
// ============================================================
describe('getLoyaltyEffects', () => {
  countedTest('returns correct effects for loyalty 0', () => {
    const effects = getLoyaltyEffects(0);
    assert.strictEqual(effects.leaves, true);
  });

  countedTest('returns correct effects for loyalty 50', () => {
    const effects = getLoyaltyEffects(50);
    assert.strictEqual(effects.attackMod, 1);
    assert.strictEqual(effects.leaves, false);
  });

  countedTest('returns correct effects for loyalty 100', () => {
    const effects = getLoyaltyEffects(100);
    assert.strictEqual(effects.attackMod, 3);
    assert.strictEqual(effects.loyaltyFloor, 25);
  });
});

// ============================================================
// detectThresholdCrossings
// ============================================================
describe('detectThresholdCrossings', () => {
  countedTest('detects upward crossing from 40 to 50', () => {
    const crossings = detectThresholdCrossings(40, 50);
    assert.strictEqual(crossings.length, 1);
    assert.strictEqual(crossings[0].tier.name, 'Friendly');
    assert.strictEqual(crossings[0].direction, 'up');
  });

  countedTest('detects downward crossing from 50 to 40', () => {
    const crossings = detectThresholdCrossings(50, 40);
    assert.strictEqual(crossings.length, 1);
    assert.strictEqual(crossings[0].tier.name, 'Friendly');
    assert.strictEqual(crossings[0].direction, 'down');
  });

  countedTest('detects multiple crossings (big jump up)', () => {
    const crossings = detectThresholdCrossings(5, 80);
    assert.ok(crossings.length >= 3);
    const names = crossings.map(c => c.tier.name);
    assert.ok(names.includes('Neutral'));
    assert.ok(names.includes('Friendly'));
    assert.ok(names.includes('Devoted'));
  });

  countedTest('returns empty array when no threshold crossed', () => {
    assert.deepStrictEqual(detectThresholdCrossings(50, 55), []);
  });

  countedTest('returns empty array for same value', () => {
    assert.deepStrictEqual(detectThresholdCrossings(50, 50), []);
  });

  countedTest('handles non-number inputs gracefully', () => {
    const crossings = detectThresholdCrossings(undefined, undefined);
    assert.deepStrictEqual(crossings, []);
  });

  countedTest('detects crossing down to 0 (Abandoned)', () => {
    const crossings = detectThresholdCrossings(15, 0);
    const names = crossings.map(c => c.tier.name);
    assert.ok(names.includes('Discontent'));
  });
});

// ============================================================
// processLoyaltyEvents
// ============================================================
describe('processLoyaltyEvents', () => {
  countedTest('adds log message when threshold crossed', () => {
    const state = makeState([makeCompanion({ loyalty: 50 })]);
    const result = processLoyaltyEvents(state, 'fenris', 40, 50);
    const logs = result.log || [];
    assert.ok(logs.some(l => typeof l === 'string' && l.includes('Fenris')));
  });

  countedTest('adds journal entry for significant events', () => {
    const state = makeState([makeCompanion({ loyalty: 75 })]);
    const result = processLoyaltyEvents(state, 'fenris', 70, 75);
    const entries = result.journal?.entries || [];
    assert.ok(entries.length > 0);
    assert.ok(entries.some(e => e.title.includes('Fenris')));
  });

  countedTest('does not add journal entry for Neutral tier', () => {
    const state = makeState([makeCompanion({ loyalty: 25 })]);
    const result = processLoyaltyEvents(state, 'fenris', 20, 25);
    const entries = result.journal?.entries || [];
    assert.strictEqual(entries.filter(e => e.title.includes('Indifferent')).length, 0);
  });

  countedTest('marks Soulbound and Abandoned journal entries as important', () => {
    const state = makeState([makeCompanion({ loyalty: 100 })]);
    const result = processLoyaltyEvents(state, 'fenris', 95, 100);
    const entries = result.journal?.entries || [];
    const soulboundEntry = entries.find(e => e.title.includes('Unbreakable bond'));
    assert.ok(soulboundEntry);
    assert.strictEqual(soulboundEntry.isImportant, true);
  });

  countedTest('sets soulbound flag on companion when reaching 100', () => {
    const state = makeState([makeCompanion({ loyalty: 100 })]);
    const result = processLoyaltyEvents(state, 'fenris', 95, 100);
    const comp = result.companions.find(c => c.id === 'fenris');
    assert.strictEqual(comp.soulbound, true);
  });

  countedTest('dismisses companion when loyalty drops to 0', () => {
    const state = makeState([makeCompanion({ loyalty: 0 })]);
    const result = processLoyaltyEvents(state, 'fenris', 5, 0);
    // Companion should be removed (dismissed)
    const comp = result.companions.find(c => c.id === 'fenris');
    assert.strictEqual(comp, undefined);
  });

  countedTest('returns state unchanged when no threshold crossed', () => {
    const state = makeState([makeCompanion({ loyalty: 55 })]);
    const result = processLoyaltyEvents(state, 'fenris', 50, 55);
    assert.strictEqual(result, state);
  });
});

// ============================================================
// adjustLoyaltyWithEvents
// ============================================================
describe('adjustLoyaltyWithEvents', () => {
  countedTest('increases loyalty and triggers events', () => {
    const state = makeState([makeCompanion({ loyalty: 45 })]);
    const result = adjustLoyaltyWithEvents(state, 'fenris', 10);
    const comp = result.companions.find(c => c.id === 'fenris');
    assert.strictEqual(comp.loyalty, 55);
  });

  countedTest('decreases loyalty and triggers events', () => {
    const state = makeState([makeCompanion({ loyalty: 55 })]);
    const result = adjustLoyaltyWithEvents(state, 'fenris', -10);
    const comp = result.companions.find(c => c.id === 'fenris');
    assert.strictEqual(comp.loyalty, 45);
  });

  countedTest('clamps loyalty at 100', () => {
    const state = makeState([makeCompanion({ loyalty: 95 })]);
    const result = adjustLoyaltyWithEvents(state, 'fenris', 20);
    const comp = result.companions.find(c => c.id === 'fenris');
    assert.strictEqual(comp.loyalty, 100);
  });

  countedTest('clamps loyalty at 0 for non-soulbound', () => {
    const state = makeState([makeCompanion({ loyalty: 5 })]);
    const result = adjustLoyaltyWithEvents(state, 'fenris', -20);
    // Companion should be dismissed (loyalty hit 0)
    const comp = result.companions.find(c => c.id === 'fenris');
    assert.strictEqual(comp, undefined);
  });

  countedTest('respects soulbound loyalty floor of 25', () => {
    const state = makeState([makeCompanion({ loyalty: 30, soulbound: true })]);
    const result = adjustLoyaltyWithEvents(state, 'fenris', -50);
    const comp = result.companions.find(c => c.id === 'fenris');
    assert.strictEqual(comp.loyalty, 25);
  });

  countedTest('returns state unchanged for unknown companion', () => {
    const state = makeState([makeCompanion()]);
    const result = adjustLoyaltyWithEvents(state, 'nonexistent', 10);
    assert.strictEqual(result, state);
  });

  countedTest('returns state unchanged when loyalty would not change', () => {
    const state = makeState([makeCompanion({ loyalty: 100 })]);
    const result = adjustLoyaltyWithEvents(state, 'fenris', 10);
    assert.strictEqual(result, state);
  });

  countedTest('handles loyalty change for lyra companion', () => {
    const lyra = makeCompanion({ id: 'lyra', name: 'Lyra', loyalty: 45 });
    const state = makeState([lyra]);
    const result = adjustLoyaltyWithEvents(state, 'lyra', 10);
    const comp = result.companions.find(c => c.id === 'lyra');
    assert.strictEqual(comp.loyalty, 55);
    // Check personalised text was used
    const logs = result.log || [];
    assert.ok(logs.some(l => typeof l === 'string' && l.includes('Lyra')));
  });
});

// ============================================================
// getCompanionLoyaltySummary
// ============================================================
describe('getCompanionLoyaltySummary', () => {
  countedTest('returns tier and effects for existing companion', () => {
    const state = makeState([makeCompanion({ loyalty: 75 })]);
    const summary = getCompanionLoyaltySummary(state, 'fenris');
    assert.ok(summary);
    assert.strictEqual(summary.tier.name, 'Devoted');
    assert.strictEqual(summary.effects.attackMod, 2);
    assert.strictEqual(summary.effects.unlocksAbility, true);
  });

  countedTest('returns null for unknown companion', () => {
    const state = makeState([]);
    assert.strictEqual(getCompanionLoyaltySummary(state, 'fenris'), null);
  });

  countedTest('includes soulbound status', () => {
    const state = makeState([makeCompanion({ loyalty: 100, soulbound: true })]);
    const summary = getCompanionLoyaltySummary(state, 'fenris');
    assert.strictEqual(summary.soulbound, true);
  });

  countedTest('reports soulbound false when not set', () => {
    const state = makeState([makeCompanion({ loyalty: 50 })]);
    const summary = getCompanionLoyaltySummary(state, 'fenris');
    assert.strictEqual(summary.soulbound, false);
  });
});

// ============================================================
// Easter egg / saboteur defense checks
// ============================================================
describe('Easter egg defense', () => {
  countedTest('no forbidden motifs in COMPANION_EVENT_TEXT', () => {
    const forbidden = ['egg', 'easter', 'bunny', 'rabbit', 'chicken', 'hatch', 'nest', 'hunt', 'basket'];
    const allText = JSON.stringify(COMPANION_EVENT_TEXT).toLowerCase();
    for (const word of forbidden) {
      assert.ok(!allText.includes(word), `Found forbidden word "${word}" in companion event text`);
    }
  });

  countedTest('no forbidden motifs in LOYALTY_TIERS', () => {
    const forbidden = ['egg', 'easter', 'bunny', 'rabbit'];
    const allText = JSON.stringify(LOYALTY_TIERS).toLowerCase();
    for (const word of forbidden) {
      assert.ok(!allText.includes(word), `Found forbidden word "${word}" in LOYALTY_TIERS`);
    }
  });
});
