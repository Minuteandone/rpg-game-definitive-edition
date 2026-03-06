/**
 * Equipment Set Tests — AI Village RPG
 * Run: node tests/equipment-sets-test.mjs
 */

import { equipmentSets, getActiveEquipmentSetIds, getEquipmentSetBonuses } from '../src/equipment-sets.js';
import { getEquipmentBonuses } from '../src/inventory.js';
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

// ── Test: Equipment Set Definitions ─────────────────────────────────
console.log('\n--- Equipment Set Definitions ---');
assert(Array.isArray(equipmentSets) && equipmentSets.length > 0, 'equipmentSets exports an array');

const expectedSetIds = ['rustySet', 'ironSet', 'huntersSet', 'mageSet', 'fortuneSet'];
assert(expectedSetIds.every((id) => equipmentSets.some((set) => set.id === id)), 'All expected set IDs exist');

equipmentSets.forEach((set) => {
  const label = set.id || 'unknown set';
  const hasProps = ['id', 'name', 'flavor', 'requiredItems', 'bonuses'].every((prop) => prop in set);
  assert(hasProps, `${label} exposes required properties`);
  assert(Array.isArray(set.requiredItems) && set.requiredItems.length > 0, `${label} has requiredItems array`);
  set.requiredItems.forEach((itemId) => {
    assert(!!items[itemId], `${label} requires existing item ${itemId}`);
  });
  assert(typeof set.bonuses === 'object', `${label} bonuses are an object`);
  assert(
    Object.values(set.bonuses).every((v) => typeof v === 'number'),
    `${label} bonuses are numeric values`
  );
});

// ── Test: getActiveEquipmentSetIds ──────────────────────────────────
console.log('\n--- getActiveEquipmentSetIds ---');
const emptyEquipment = { weapon: null, armor: null, accessory: null };
assert(getActiveEquipmentSetIds(null).length === 0, 'Null equipment returns empty array');
assert(getActiveEquipmentSetIds(undefined).length === 0, 'Undefined equipment returns empty array');
assert(getActiveEquipmentSetIds(emptyEquipment).length === 0, 'Empty equipment slots return empty array');

const partialRusty = { weapon: 'rustySword', armor: null, accessory: null };
assert(getActiveEquipmentSetIds(partialRusty).length === 0, 'Partial Rusty set does not activate');

const partialMixed = { weapon: 'ironSword', armor: 'leatherArmor', accessory: 'ringOfFortune' };
assert(getActiveEquipmentSetIds(partialMixed).length === 0, 'Mixed pieces from different sets do not activate');

const rustyEquipment = { weapon: 'rustySword', armor: 'leatherArmor', accessory: null };
const rustyActive = getActiveEquipmentSetIds(rustyEquipment);
assert(rustyActive.length === 1 && rustyActive[0] === 'rustySet', 'Rusty set activates with sword + armor');

const ironEquipment = { weapon: 'ironSword', armor: 'chainmail', accessory: null };
const ironActive = getActiveEquipmentSetIds(ironEquipment);
assert(ironActive.length === 1 && ironActive[0] === 'ironSet', 'Iron set activates with sword + chainmail');

const ironWithExtras = { weapon: 'ironSword', armor: 'chainmail', accessory: 'ringOfFortune' };
const ironOnly = getActiveEquipmentSetIds(ironWithExtras);
assert(
  ironOnly.length === 1 && ironOnly[0] === 'ironSet',
  'Only matching set activates even with extra gear equipped'
);

// ── Test: getEquipmentSetBonuses ────────────────────────────────────
console.log('\n--- getEquipmentSetBonuses ---');
const zeroBonuses = getEquipmentSetBonuses(null);
assert(
  zeroBonuses.attack === 0 &&
    zeroBonuses.defense === 0 &&
    zeroBonuses.speed === 0 &&
    zeroBonuses.magic === 0 &&
    zeroBonuses.critChance === 0,
  'Null equipment yields zero bonuses'
);

const rustyBonuses = getEquipmentSetBonuses(rustyEquipment);
assert(
  rustyBonuses.attack === 3 &&
    rustyBonuses.defense === 2 &&
    rustyBonuses.speed === 1 &&
    rustyBonuses.magic === 0 &&
    rustyBonuses.critChance === 0,
  'Rusty set grants expected stat bonuses'
);

const ironBonuses = getEquipmentSetBonuses(ironEquipment);
assert(
  ironBonuses.attack === 6 &&
    ironBonuses.defense === 8 &&
    ironBonuses.speed === 0 &&
    ironBonuses.magic === 0 &&
    ironBonuses.critChance === 2,
  'Iron set grants expected stat bonuses'
);

const mageEquipment = { weapon: 'arcaneStaff', armor: 'mageRobe', accessory: null };
const mageBonuses = getEquipmentSetBonuses(mageEquipment);
assert(
  mageBonuses.attack === 0 &&
    mageBonuses.defense === 4 &&
    mageBonuses.speed === 0 &&
    mageBonuses.magic === 12 &&
    mageBonuses.critChance === 4,
  'Mage set grants expected stat bonuses'
);

// ── Integration: inventory.getEquipmentBonuses ──────────────────────
console.log('\n--- inventory.getEquipmentBonuses Integration ---');
const combinedBonuses = getEquipmentBonuses(ironEquipment);
assert(
  combinedBonuses.attack === 18 &&
    combinedBonuses.defense === 20 &&
    combinedBonuses.speed === -1 &&
    combinedBonuses.magic === 0 &&
    combinedBonuses.critChance === 4,
  'Set bonuses are included alongside item stats in getEquipmentBonuses'
);

// ── Summary ─────────────────────────────────────────────────────────
console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
