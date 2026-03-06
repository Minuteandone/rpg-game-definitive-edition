/**
 * Stats Display UI Tests
 * Tests for the stats display UI module
 */

import { formatStatRow, formatSectionHeader, renderStatsPanel, getStatsDisplayStyles, getStatsActions } from '../src/stats-display-ui.js';

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
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

console.log('=== Stats Display UI Tests ===\n');

console.log('--- formatStatRow ---');
test('returns HTML string with label and value', () => {
  const result = formatStatRow('Test Label', 42);
  assert(result.includes('Test Label'), 'should contain label');
  assert(result.includes('42'), 'should contain value');
  assert(result.includes('stat-row'), 'should have stat-row class');
});

test('escapes HTML in value', () => {
  const result = formatStatRow('Label', '<script>alert("xss")</script>');
  assert(!result.includes('<script>'), 'should escape script tags');
  assert(result.includes('&lt;script&gt;'), 'should contain escaped tag');
});

test('handles string values', () => {
  const result = formatStatRow('Most Defeated', 'Slime (5)');
  assert(result.includes('Slime (5)'), 'should contain string value');
});

test('handles zero values', () => {
  const result = formatStatRow('Enemies', 0);
  assert(result.includes('0'), 'should show zero');
});

test('handles numeric string values', () => {
  const result = formatStatRow('Ratio', '2.5');
  assert(result.includes('2.5'), 'should contain ratio');
});

console.log('\n--- formatSectionHeader ---');
test('returns section header HTML', () => {
  const result = formatSectionHeader('Combat');
  assert(result.includes('Combat'), 'should contain title');
  assert(result.includes('stat-section-header'), 'should have class');
});

test('handles emoji in header', () => {
  const result = formatSectionHeader('⚔️ Combat');
  assert(result.includes('⚔️'), 'should contain emoji');
});

console.log('\n--- renderStatsPanel ---');
test('returns message when summary is null', () => {
  const result = renderStatsPanel(null);
  assert(result.includes('No statistics available'), 'should show no stats message');
});

test('returns message when summary is undefined', () => {
  const result = renderStatsPanel(undefined);
  assert(result.includes('No statistics available'), 'should show no stats message');
});

test('renders full panel with valid summary', () => {
  const summary = {
    enemiesDefeated: 10,
    mostDefeated: 'Goblin (5)',
    totalDamageDealt: 500,
    totalDamageReceived: 200,
    damageRatio: '2.5',
    itemsUsed: 3,
    abilitiesUsed: 15,
    goldEarned: 100,
    xpEarned: 250,
    battlesWon: 8,
    battlesFled: 2,
    turnsPlayed: 45,
  };
  const result = renderStatsPanel(summary);
  
  assert(result.includes('stats-panel'), 'should have stats-panel class');
  assert(result.includes('Game Statistics'), 'should have title');
  assert(result.includes('10'), 'should show enemies defeated');
  assert(result.includes('Goblin (5)'), 'should show most defeated');
  assert(result.includes('500'), 'should show damage dealt');
  assert(result.includes('200'), 'should show damage received');
  assert(result.includes('2.5'), 'should show damage ratio');
  assert(result.includes('3'), 'should show items used');
  assert(result.includes('15'), 'should show abilities used');
  assert(result.includes('100'), 'should show gold earned');
  assert(result.includes('250'), 'should show xp earned');
  assert(result.includes('8'), 'should show battles won');
  assert(result.includes('2'), 'should show battles fled');
  assert(result.includes('45'), 'should show turns played');
});

test('includes combat section', () => {
  const summary = {
    enemiesDefeated: 5,
    mostDefeated: 'None',
    totalDamageDealt: 100,
    totalDamageReceived: 50,
    damageRatio: '2.0',
    itemsUsed: 0,
    abilitiesUsed: 0,
    goldEarned: 0,
    xpEarned: 0,
    battlesWon: 0,
    battlesFled: 0,
    turnsPlayed: 0,
  };
  const result = renderStatsPanel(summary);
  assert(result.includes('Combat'), 'should include Combat section');
  assert(result.includes('Enemies Defeated'), 'should include enemies defeated label');
});

test('includes battle section', () => {
  const summary = {
    enemiesDefeated: 0,
    mostDefeated: 'None',
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    damageRatio: '0.0',
    itemsUsed: 0,
    abilitiesUsed: 0,
    goldEarned: 0,
    xpEarned: 0,
    battlesWon: 3,
    battlesFled: 1,
    turnsPlayed: 20,
  };
  const result = renderStatsPanel(summary);
  assert(result.includes('Battles'), 'should include Battles section');
  assert(result.includes('Battles Won'), 'should include battles won label');
  assert(result.includes('Battles Fled'), 'should include battles fled label');
});

test('includes resources section', () => {
  const summary = {
    enemiesDefeated: 0,
    mostDefeated: 'None',
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    damageRatio: '0.0',
    itemsUsed: 5,
    abilitiesUsed: 10,
    goldEarned: 50,
    xpEarned: 100,
    battlesWon: 0,
    battlesFled: 0,
    turnsPlayed: 0,
  };
  const result = renderStatsPanel(summary);
  assert(result.includes('Resources'), 'should include Resources section');
  assert(result.includes('Items Used'), 'should include items used label');
  assert(result.includes('Gold Earned'), 'should include gold earned label');
});

test('handles infinity damage ratio', () => {
  const summary = {
    enemiesDefeated: 1,
    mostDefeated: 'Slime (1)',
    totalDamageDealt: 100,
    totalDamageReceived: 0,
    damageRatio: '∞',
    itemsUsed: 0,
    abilitiesUsed: 0,
    goldEarned: 0,
    xpEarned: 0,
    battlesWon: 1,
    battlesFled: 0,
    turnsPlayed: 5,
  };
  const result = renderStatsPanel(summary);
  assert(result.includes('∞'), 'should show infinity symbol');
});

console.log('\n--- getStatsDisplayStyles ---');
test('returns CSS string', () => {
  const result = getStatsDisplayStyles();
  assert(typeof result === 'string', 'should be string');
  assert(result.includes('.stats-panel'), 'should have stats-panel style');
  assert(result.includes('.stat-row'), 'should have stat-row style');
  assert(result.includes('.stat-label'), 'should have stat-label style');
  assert(result.includes('.stat-value'), 'should have stat-value style');
});

test('includes section header styles', () => {
  const result = getStatsDisplayStyles();
  assert(result.includes('.stat-section-header'), 'should have section header style');
});

test('includes display flex for rows', () => {
  const result = getStatsDisplayStyles();
  assert(result.includes('display: flex'), 'should use flexbox');
});

console.log('\n--- getStatsActions ---');
test('returns close button HTML', () => {
  const result = getStatsActions();
  assert(result.includes('button'), 'should contain button');
  assert(result.includes('CLOSE_STATS'), 'should have close stats action');
  assert(result.includes('Close'), 'should have Close label');
});

console.log('\n==========================================');
console.log(`Stats Display UI tests: ${passed} passed, ${failed} failed, ${passed + failed} total`);
process.exit(failed > 0 ? 1 : 0);
