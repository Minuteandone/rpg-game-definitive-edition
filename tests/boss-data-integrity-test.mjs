/**
 * Boss Data Integrity Tests 
 *
 * Focus: structural and semantic integrity of src/data/bosses.js
 * to support the multi-phase Boss Battle System.
 */

import { BOSSES, BOSS_ABILITIES } from '../src/data/bosses.js';
import { items } from '../src/data/items.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

console.log('\n=== Boss Data Integrity ===');

assert(BOSSES && typeof BOSSES === 'object', 'BOSSES export is an object');
const bossEntries = Object.entries(BOSSES || {});
assert(bossEntries.length > 0, 'BOSSES contains at least one boss');

const usedAbilityIds = new Set();
const allowedBehaviors = new Set(['basic', 'aggressive', 'caster']);

bossEntries.forEach(([id, boss]) => {
  const label = boss?.name || id;

  assert(boss && typeof boss === 'object', `${label}: boss is an object`);
  assert(boss.id === id, `${label}: boss.id matches key`);
  assert(typeof boss.name === 'string' && boss.name.trim().length > 0, `${label}: has non-empty name`);
  assert(
    typeof boss.description === 'string' && boss.description.trim().length > 0,
    `${label}: has non-empty description`
  );

  assert(boss.isBoss === true, `${label}: isBoss is true`);
  assert(typeof boss.element === 'string' && boss.element.trim().length > 0, `${label}: has element string`);

  // Rewards
  assert(Number.isInteger(boss.xpReward) && boss.xpReward > 0, `${label}: xpReward is a positive integer`);
  assert(Number.isInteger(boss.goldReward) && boss.goldReward >= 0, `${label}: goldReward is a non-negative integer`);

  // Drops
  assert(Array.isArray(boss.drops) && boss.drops.length > 0, `${label}: has at least one drop`);
  (boss.drops || []).forEach((drop, idx) => {
    const dropLabel = `${label}: drop[${idx}]`;
    assert(drop && typeof drop === 'object', `${dropLabel} is an object`);
    assert(
      typeof drop.itemId === 'string' && drop.itemId.trim().length > 0,
      `${dropLabel} has non-empty itemId`
    );
    assert(
      Object.prototype.hasOwnProperty.call(items, drop.itemId),
      `${dropLabel} itemId exists in items catalog`
    );
    assert(
      typeof drop.chance === 'number' && drop.chance >= 0 && drop.chance <= 1,
      `${dropLabel} chance is between 0 and 1`
    );
  });

  // Phases
  assert(Array.isArray(boss.phases) && boss.phases.length > 0, `${label}: has at least one phase`);
  let previousThreshold = Infinity;

  (boss.phases || []).forEach((phase, idx) => {
    const phaseLabel = `${label} [phase ${idx + 1}]`;

    assert(phase && typeof phase === 'object', `${phaseLabel}: phase is an object`);
    assert(Number.isInteger(phase.phase) && phase.phase >= 1, `${phaseLabel}: phase number is a positive integer`);

    // HP threshold should be in (0, 1] and non-increasing across phases
    const t = phase.hpThreshold;
    assert(typeof t === 'number' && t > 0 && t <= 1, `${phaseLabel}: hpThreshold is in (0, 1]`);
    assert(t <= previousThreshold, `${phaseLabel}: hpThreshold is non-increasing across phases`);
    previousThreshold = t;

    // Core stats
    assert(Number.isInteger(phase.maxHp) && phase.maxHp > 0, `${phaseLabel}: maxHp is a positive integer`);
    assert(Number.isInteger(phase.mp) && phase.mp >= 0, `${phaseLabel}: mp is a non-negative integer`);
    assert(Number.isInteger(phase.maxMp) && phase.maxMp >= 0, `${phaseLabel}: maxMp is a non-negative integer`);
    assert(Number.isInteger(phase.atk) && phase.atk > 0, `${phaseLabel}: atk is a positive integer`);
    assert(Number.isInteger(phase.def) && phase.def >= 0, `${phaseLabel}: def is a non-negative integer`);
    assert(Number.isInteger(phase.spd) && phase.spd > 0, `${phaseLabel}: spd is a positive integer`);

    // Abilities
    assert(Array.isArray(phase.abilities) && phase.abilities.length > 0, `${phaseLabel}: has at least one ability`);
    (phase.abilities || []).forEach((abilityId) => {
      assert(
        typeof abilityId === 'string' && abilityId.trim().length > 0,
        `${phaseLabel}: ability id is a non-empty string`
      );
      assert(
        Object.prototype.hasOwnProperty.call(BOSS_ABILITIES, abilityId),
        `${phaseLabel}: ability '${abilityId}' exists in BOSS_ABILITIES`
      );
      usedAbilityIds.add(abilityId);
    });

    // AI behavior and dialogue
    assert(
      typeof phase.aiBehavior === 'string' && allowedBehaviors.has(phase.aiBehavior),
      `${phaseLabel}: aiBehavior is one of ${Array.from(allowedBehaviors).join(', ')}`
    );
    assert(
      typeof phase.dialogue === 'string' && phase.dialogue.trim().length > 0,
      `${phaseLabel}: dialogue is a non-empty string`
    );
  });
});

console.log('\n=== Boss Ability Integrity ===');

assert(BOSS_ABILITIES && typeof BOSS_ABILITIES === 'object', 'BOSS_ABILITIES export is an object');
const abilityEntries = Object.entries(BOSS_ABILITIES || {});
assert(abilityEntries.length > 0, 'BOSS_ABILITIES contains at least one ability');

const allowedAbilityTypes = new Set(['physical', 'magical', 'buff', 'heal', 'drain']);

abilityEntries.forEach(([id, ability]) => {
  const label = ability?.name || id;

  assert(ability && typeof ability === 'object', `${label}: ability is an object`);
  assert(ability.id === id, `${label}: ability.id matches key`);
  assert(typeof ability.name === 'string' && ability.name.trim().length > 0, `${label}: has non-empty name`);
  assert(
    typeof ability.type === 'string' && allowedAbilityTypes.has(ability.type),
    `${label}: type is one of ${Array.from(allowedAbilityTypes).join(', ')}`
  );

  if (ability.element !== undefined) {
    assert(
      typeof ability.element === 'string' && ability.element.trim().length > 0,
      `${label}: element, if present, is a non-empty string`
    );
  }

  assert(typeof ability.power === 'number' && ability.power >= 0, `${label}: power is a non-negative number`);
  assert(typeof ability.mpCost === 'number' && ability.mpCost >= 0, `${label}: mpCost is a non-negative number`);

  assert(
    typeof ability.description === 'string' && ability.description.trim().length > 0,
    `${label}: has non-empty description`
  );

  if (ability.effect !== undefined && ability.effect !== null) {
    const effect = ability.effect;
    assert(effect && typeof effect === 'object', `${label}: effect, if present, is an object`);

    if (effect.duration !== undefined) {
      assert(
        Number.isInteger(effect.duration) && effect.duration > 0,
        `${label}: effect.duration, if present, is a positive integer`
      );
    }
    if (effect.power !== undefined) {
      assert(
        typeof effect.power === 'number' && effect.power >= 0,
        `${label}: effect.power, if present, is a non-negative number`
      );
    }
    if (effect.chance !== undefined) {
      assert(
        typeof effect.chance === 'number' && effect.chance >= 0 && effect.chance <= 1,
        `${label}: effect.chance, if present, is between 0 and 1`
      );
    }
    if (effect.type !== undefined) {
      assert(
        typeof effect.type === 'string' && effect.type.trim().length > 0,
        `${label}: effect.type, if present, is a non-empty string`
      );
    }
  }

  if (ability.type === 'drain') {
    assert(
      typeof ability.healPercent === 'number' && ability.healPercent > 0 && ability.healPercent <= 1,
      `${label}: drain abilities have healPercent between 0 and 1`
    );
  }
});

// Sanity check: all abilities referenced by bosses are defined
usedAbilityIds.forEach((abilityId) => {
  assert(
    Object.prototype.hasOwnProperty.call(BOSS_ABILITIES, abilityId),
    `Referenced boss ability '${abilityId}' exists in BOSS_ABILITIES`
  );
});

console.log('\n========================================');
console.log(`Boss data integrity: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
