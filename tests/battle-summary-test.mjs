/**
 * Battle Summary Screen Tests
 * Tests for src/battle-summary.js module
 * Created by Claude Sonnet 4.6 (Day 338)
 */

import { createBattleSummary, formatBattleSummary } from '../src/battle-summary.js';
import { initialStateWithClass } from '../src/state.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// =========================================================
// createBattleSummary tests
// =========================================================
console.log('\ncreateBattleSummary():');

test('returns object with all required keys', () => {
  const state = { xpGained: 50, goldGained: 10, enemy: { name: 'Goblin' }, lootedItems: [], pendingLevelUps: [] };
  const summary = createBattleSummary(state);
  assert('xpGained' in summary, 'missing xpGained');
  assert('goldGained' in summary, 'missing goldGained');
  assert('enemyName' in summary, 'missing enemyName');
  assert('lootedItems' in summary, 'missing lootedItems');
  assert('levelUps' in summary, 'missing levelUps');
});

test('extracts xpGained correctly', () => {
  const summary = createBattleSummary({ xpGained: 75, goldGained: 0, enemy: { name: 'Slime' }, lootedItems: [], pendingLevelUps: [] });
  assertEqual(summary.xpGained, 75);
});

test('extracts goldGained correctly', () => {
  const summary = createBattleSummary({ xpGained: 0, goldGained: 20, enemy: { name: 'Slime' }, lootedItems: [], pendingLevelUps: [] });
  assertEqual(summary.goldGained, 20);
});

test('extracts enemy name from state.enemy.name', () => {
  const summary = createBattleSummary({ xpGained: 0, goldGained: 0, enemy: { name: 'Forest Wolf' }, lootedItems: [], pendingLevelUps: [] });
  assertEqual(summary.enemyName, 'Forest Wolf');
});

test('prefers enemy displayName and falls back to name in create+format pipeline', () => {
  const withDisplayName = createBattleSummary({
    xpGained: 0,
    goldGained: 0,
    enemy: { name: 'Slime', displayName: 'Wicked Slime from Beyond' },
    lootedItems: [],
    pendingLevelUps: []
  });
  const withDisplayNameFmt = formatBattleSummary(withDisplayName);
  assertEqual(withDisplayName.enemyName, 'Wicked Slime from Beyond');
  assertEqual(withDisplayNameFmt.enemyLine, 'Defeated: Wicked Slime from Beyond');

  const withNameOnly = createBattleSummary({
    xpGained: 0,
    goldGained: 0,
    enemy: { name: 'Slime' },
    lootedItems: [],
    pendingLevelUps: []
  });
  const withNameOnlyFmt = formatBattleSummary(withNameOnly);
  assertEqual(withNameOnly.enemyName, 'Slime');
  assertEqual(withNameOnlyFmt.enemyLine, 'Defeated: Slime');
});

test('defaults to "Unknown Enemy" when enemy is missing', () => {
  const summary = createBattleSummary({ xpGained: 0, goldGained: 0, lootedItems: [], pendingLevelUps: [] });
  assertEqual(summary.enemyName, 'Unknown Enemy');
});

test('defaults xpGained to 0 when missing', () => {
  const summary = createBattleSummary({ goldGained: 5, enemy: { name: 'X' }, lootedItems: [], pendingLevelUps: [] });
  assertEqual(summary.xpGained, 0);
});

test('defaults goldGained to 0 when missing', () => {
  const summary = createBattleSummary({ xpGained: 5, enemy: { name: 'X' }, lootedItems: [], pendingLevelUps: [] });
  assertEqual(summary.goldGained, 0);
});

test('copies lootedItems array correctly', () => {
  const items = ['sword', 'potion'];
  const summary = createBattleSummary({ xpGained: 0, goldGained: 0, enemy: { name: 'X' }, lootedItems: items, pendingLevelUps: [] });
  assert(Array.isArray(summary.lootedItems), 'lootedItems should be array');
  assertEqual(summary.lootedItems.length, 2);
  assertEqual(summary.lootedItems[0], 'sword');
  assertEqual(summary.lootedItems[1], 'potion');
});

test('defaults lootedItems to [] when missing', () => {
  const summary = createBattleSummary({ xpGained: 0, goldGained: 0, enemy: { name: 'X' }, pendingLevelUps: [] });
  assert(Array.isArray(summary.lootedItems), 'lootedItems should be array');
  assertEqual(summary.lootedItems.length, 0);
});

test('copies pendingLevelUps as levelUps', () => {
  const levelUps = [{ name: 'Hero', newLevel: 3 }];
  const summary = createBattleSummary({ xpGained: 0, goldGained: 0, enemy: { name: 'X' }, lootedItems: [], pendingLevelUps: levelUps });
  assert(Array.isArray(summary.levelUps), 'levelUps should be array');
  assertEqual(summary.levelUps.length, 1);
  assertEqual(summary.levelUps[0].newLevel, 3);
});

test('defaults levelUps to [] when pendingLevelUps missing', () => {
  const summary = createBattleSummary({ xpGained: 0, goldGained: 0, enemy: { name: 'X' }, lootedItems: [] });
  assert(Array.isArray(summary.levelUps), 'levelUps should be array');
  assertEqual(summary.levelUps.length, 0);
});

test('lootedItems is a copy, not same reference', () => {
  const original = ['potion'];
  const summary = createBattleSummary({ xpGained: 0, goldGained: 0, enemy: { name: 'X' }, lootedItems: original, pendingLevelUps: [] });
  original.push('sword');
  assertEqual(summary.lootedItems.length, 1, 'Mutating original should not affect summary');
});

test('levelUps is a copy, not same reference', () => {
  const original = [{ name: 'A', newLevel: 2 }];
  const summary = createBattleSummary({ xpGained: 0, goldGained: 0, enemy: { name: 'X' }, lootedItems: [], pendingLevelUps: original });
  original.push({ name: 'B', newLevel: 3 });
  assertEqual(summary.levelUps.length, 1, 'Mutating original should not affect summary');
});

// =========================================================
// formatBattleSummary tests
// =========================================================
console.log('\nformatBattleSummary():');

test('returns object with title "Battle Won!"', () => {
  const summary = { xpGained: 50, goldGained: 10, enemyName: 'Goblin', lootedItems: [], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assertEqual(fmt.title, 'Battle Won!');
});

test('enemyLine includes enemy name', () => {
  const summary = { xpGained: 50, goldGained: 10, enemyName: 'Dragon', lootedItems: [], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.enemyLine.includes('Dragon'), `enemyLine should include 'Dragon': ${fmt.enemyLine}`);
});

test('xpLine includes xpGained amount', () => {
  const summary = { xpGained: 123, goldGained: 0, enemyName: 'X', lootedItems: [], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.xpLine.includes('123'), `xpLine should include 123: ${fmt.xpLine}`);
});

test('goldLine includes goldGained amount', () => {
  const summary = { xpGained: 0, goldGained: 45, enemyName: 'X', lootedItems: [], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.goldLine.includes('45'), `goldLine should include 45: ${fmt.goldLine}`);
});

test('hasLoot is false when lootedItems is empty', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: [], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assert(!fmt.hasLoot, 'hasLoot should be false for empty lootedItems');
});

test('hasLoot is true when lootedItems has items', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: ['potion'], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.hasLoot, 'hasLoot should be true when items present');
});

test('lootLines says "No items looted." when empty', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: [], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.lootLines.length >= 1, 'Should have at least one lootLine');
  assert(fmt.lootLines[0].includes('No items looted'), `Should say no items: ${fmt.lootLines[0]}`);
});

test('lootLines includes item names when items present', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: ['Iron Sword'], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.lootLines.some(l => l.includes('Iron Sword')), 'lootLines should include item name');
});

test('lootLines handles object items with name property', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: [{ name: 'Magic Wand', id: 'magicWand' }], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.lootLines.some(l => l.includes('Magic Wand')), `Should include item name from object: ${fmt.lootLines}`);
});

test('hasLevelUps is false when no level ups', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: [], levelUps: [] };
  const fmt = formatBattleSummary(summary);
  assert(!fmt.hasLevelUps, 'hasLevelUps should be false');
});

test('hasLevelUps is true when level ups present', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: [], levelUps: [{ name: 'Hero', newLevel: 2 }] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.hasLevelUps, 'hasLevelUps should be true');
});

test('levelUpLines includes character name and new level', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: [], levelUps: [{ name: 'Aria', newLevel: 5 }] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.levelUpLines.length > 0, 'Should have levelUpLines');
  assert(fmt.levelUpLines[0].includes('Aria'), `Should include name: ${fmt.levelUpLines[0]}`);
  assert(fmt.levelUpLines[0].includes('5'), `Should include level: ${fmt.levelUpLines[0]}`);
});

test('levelUpLines uses memberName when name is absent', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: [], levelUps: [{ memberName: 'Bran', newLevel: 4 }] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.levelUpLines[0].includes('Bran'), `Should include memberName: ${fmt.levelUpLines[0]}`);
});

test('levelUpLines defaults to "Unknown" when both name and memberName absent', () => {
  const summary = { xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: [], levelUps: [{ newLevel: 3 }] };
  const fmt = formatBattleSummary(summary);
  assert(fmt.levelUpLines[0].includes('Unknown'), `Should include Unknown: ${fmt.levelUpLines[0]}`);
});

test('multiple levelUpLines for multiple level ups', () => {
  const summary = {
    xpGained: 0, goldGained: 0, enemyName: 'X', lootedItems: [],
    levelUps: [{ name: 'Alice', newLevel: 3 }, { name: 'Bob', newLevel: 5 }]
  };
  const fmt = formatBattleSummary(summary);
  assertEqual(fmt.levelUpLines.length, 2, 'Should have 2 level up lines');
});

// =========================================================
// createBattleSummary + formatBattleSummary integration
// =========================================================
console.log('\ncreate + format pipeline:');

test('full pipeline: victory state → createBattleSummary → formatBattleSummary', () => {
  const victoryState = {
    xpGained: 100,
    goldGained: 25,
    enemy: { name: 'Dark Orc' },
    lootedItems: ['Health Potion', 'Leather Armor'],
    pendingLevelUps: [{ name: 'Warrior', newLevel: 4 }],
  };
  const summary = createBattleSummary(victoryState);
  const fmt = formatBattleSummary(summary);
  
  assertEqual(fmt.title, 'Battle Won!');
  assert(fmt.enemyLine.includes('Dark Orc'), 'Enemy line includes Dark Orc');
  assert(fmt.xpLine.includes('100'), 'XP line includes 100');
  assert(fmt.goldLine.includes('25'), 'Gold line includes 25');
  assert(fmt.hasLoot, 'Has loot');
  assert(fmt.lootLines.some(l => l.includes('Health Potion')), 'Has Health Potion');
  assert(fmt.hasLevelUps, 'Has level ups');
  assert(fmt.levelUpLines[0].includes('Warrior'), 'Level up includes character name');
  assert(fmt.levelUpLines[0].includes('4'), 'Level up includes new level');
});

// =========================================================
// initialStateWithClass integration check
// =========================================================
console.log('\ninitialStateWithClass compatibility:');

test('initialStateWithClass returns state usable with createBattleSummary', () => {
  const state = initialStateWithClass('warrior');
  // Simulate victory state fields
  const victoryLike = { ...state, xpGained: 10, goldGained: 5, enemy: { name: 'Goblin' }, lootedItems: [], pendingLevelUps: [] };
  const summary = createBattleSummary(victoryLike);
  assertEqual(summary.xpGained, 10);
  assertEqual(summary.goldGained, 5);
  assertEqual(summary.enemyName, 'Goblin');
});

// =========================================================
// Summary
// =========================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`Battle Summary Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error(`\n${failed} test(s) failed!`);
  process.exit(1);
} else {
  console.log('\nAll battle summary tests passed! ✅');
}
