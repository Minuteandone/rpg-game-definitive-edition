/**
 * Item Catalog Integrity Tests — AI Village RPG
 *
 * Focus: structural and semantic integrity of src/data/items.js
 * to support inventory, loot, and shop systems.
 */

import { items, rarityColors, lootTables } from '../src/data/items.js';

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

console.log('\n=== Item Catalog Integrity ===');

// Basic shape
assert(items && typeof items === 'object', 'items export is an object');
const itemEntries = Object.entries(items);
assert(itemEntries.length > 0, 'items contains at least one item');

const allowedTypes = new Set(['consumable', 'weapon', 'armor', 'accessory']);
const allowedRarities = new Set(Object.keys(rarityColors));

// Per-item validation
itemEntries.forEach(([id, item]) => {
  const label = item?.name || id;

  assert(item && typeof item === 'object', `${label}: is an object`);
  assert(item.id === id, `${label}: item.id matches key`);
  assert(typeof item.name === 'string' && item.name.trim().length > 0, `${label}: has non-empty name`);
  assert(
    typeof item.description === 'string' && item.description.trim().length > 0,
    `${label}: has non-empty description`
  );

  assert(allowedTypes.has(item.type), `${label}: type is one of ${[...allowedTypes].join(', ')}`);
  assert(item.category === item.type, `${label}: category matches type`);

  assert(allowedRarities.has(item.rarity), `${label}: rarity is one of defined rarityColors`);

  // value should be a non-negative integer (gold cost)
  const v = item.value;
  assert(Number.isInteger(v) && v >= 0, `${label}: value is a non-negative integer`);

  // stats/effect basic shape
  assert(item.stats && typeof item.stats === 'object', `${label}: stats is an object`);
  assert(item.effect && typeof item.effect === 'object', `${label}: effect is an object`);

  // Type-specific expectations
  if (item.type === 'weapon') {
    assert(
      typeof item.stats.attack === 'number' && item.stats.attack > 0,
      `${label}: weapon has positive attack stat`
    );
  }

  if (item.type === 'armor') {
    assert(
      typeof item.stats.defense === 'number' && item.stats.defense > 0,
      `${label}: armor has positive defense stat`
    );
  }

  if (item.type === 'accessory') {
    const statKeys = Object.keys(item.stats || {});
    assert(statKeys.length > 0, `${label}: accessory defines at least one stat bonus`);
  }

  if (item.type === 'consumable') {
    assert(
      Object.keys(item.effect || {}).length > 0,
      `${label}: consumable defines at least one effect field`
    );
  }
});

console.log('\n=== Loot Table Integrity ===');

// Loot table rarities should align with rarityColors and use non-negative weights
Object.entries(lootTables).forEach(([tableId, table]) => {
  assert(table && typeof table === 'object', `${tableId}: loot table is an object`);
  const weights = table.rarityWeights || {};
  assert(weights && typeof weights === 'object', `${tableId}: has rarityWeights object`);

  const rarities = Object.keys(weights);
  assert(rarities.length > 0, `${tableId}: defines at least one rarity weight`);

  let total = 0;
  rarities.forEach((rarity) => {
    assert(allowedRarities.has(rarity), `${tableId}: rarity ${rarity} is defined in rarityColors`);
    const w = weights[rarity];
    assert(typeof w === 'number' && w >= 0, `${tableId}: weight for ${rarity} is non-negative number`);
    total += Math.max(0, w);
  });

  assert(total > 0, `${tableId}: has positive total loot weight`);
});

console.log('\n========================================');
console.log(`Item catalog integrity: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
