/**
 * Quest Rewards System Tests
 * Tests for src/quest-rewards.js and src/quest-rewards-ui.js
 * Owner: Claude Sonnet 4.6
 *
 * Covers: buildPendingRewards, getPendingRewardsTotal, claimAllQuestRewards,
 *         hasPendingRewards, formatRewardItemName, UI rendering, handler integration
 */

import {
  buildPendingRewards,
  getPendingRewardsTotal,
  claimAllQuestRewards,
  hasPendingRewards,
  formatRewardItemName,
} from '../src/quest-rewards.js';

import {
  renderQuestCompletionCard,
  renderQuestRewardScreen,
  renderQuestRewardActions,
  getQuestRewardStyles,
} from '../src/quest-rewards-ui.js';

import { readFileSync } from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed += 1;
    process.stdout.write(`  \u2705 ${label}\n`);
  } else {
    failed += 1;
    process.stdout.write(`  \u274c ${label}\n`);
  }
}

function assertThrows(fn, label) {
  try {
    fn();
    failed += 1;
    process.stdout.write(`  \u274c ${label} (expected throw, none occurred)\n`);
  } catch (_) {
    passed += 1;
    process.stdout.write(`  \u2705 ${label}\n`);
  }
}

// ============================================================
// 1. buildPendingRewards
// ============================================================
console.log('\n--- buildPendingRewards ---');

{
  const result = buildPendingRewards([]);
  assert(Array.isArray(result) && result.length === 0, 'returns empty array for empty input');
}

{
  const result = buildPendingRewards(null);
  assert(Array.isArray(result) && result.length === 0, 'returns empty array for null input');
}

{
  const result = buildPendingRewards(undefined);
  assert(Array.isArray(result) && result.length === 0, 'returns empty array for undefined input');
}

{
  const quests = [{ questId: 'q1', questName: 'Kill 3 slimes', rewards: { experience: 50, gold: 20, items: [] } }];
  const result = buildPendingRewards(quests);
  assert(result.length === 1, 'single quest produces one pending reward');
  assert(result[0].questId === 'q1', 'preserves questId');
  assert(result[0].questName === 'Kill 3 slimes', 'preserves questName');
  assert(result[0].rewards.experience === 50, 'preserves experience');
  assert(result[0].rewards.gold === 20, 'preserves gold');
}

{
  const quests = [
    { questId: 'q1', questName: 'Q1', rewards: { experience: 10, gold: 5, items: [] } },
    { questId: 'q2', questName: 'Q2', rewards: { experience: 30, gold: 15, items: ['health_potion'] } },
  ];
  const result = buildPendingRewards(quests);
  assert(result.length === 2, 'multiple quests produce correct count');
}

{
  // Quest with no questId should be filtered
  const quests = [{ questName: 'Missing ID Quest' }, { questId: 'q2', questName: 'Good Quest', rewards: {} }];
  const result = buildPendingRewards(quests);
  assert(result.length === 1, 'filters out quests with missing questId');
  assert(result[0].questId === 'q2', 'keeps quest with valid questId');
}

{
  // Missing questName defaults to questId
  const quests = [{ questId: 'mystery-quest', rewards: { experience: 10 } }];
  const result = buildPendingRewards(quests);
  assert(result[0].questName === 'mystery-quest', 'defaults questName to questId when missing');
}

{
  // Missing rewards defaults properly
  const quests = [{ questId: 'q1', questName: 'Test' }];
  const result = buildPendingRewards(quests);
  assert(result[0].rewards.experience === 0, 'defaults experience to 0');
  assert(result[0].rewards.gold === 0, 'defaults gold to 0');
  assert(Array.isArray(result[0].rewards.items), 'defaults items to array');
}

// ============================================================
// 2. getPendingRewardsTotal
// ============================================================
console.log('\n--- getPendingRewardsTotal ---');

{
  const result = getPendingRewardsTotal([]);
  assert(result.totalXp === 0, 'empty input: totalXp is 0');
  assert(result.totalGold === 0, 'empty input: totalGold is 0');
  assert(result.allItems.length === 0, 'empty input: allItems is empty');
}

{
  const result = getPendingRewardsTotal(null);
  assert(result.totalXp === 0, 'null input: totalXp is 0');
  assert(result.totalGold === 0, 'null input: totalGold is 0');
}

{
  const pending = [{ questId: 'q1', questName: 'Q1', rewards: { experience: 75, gold: 30, items: ['sword'] } }];
  const result = getPendingRewardsTotal(pending);
  assert(result.totalXp === 75, 'single quest: correct totalXp');
  assert(result.totalGold === 30, 'single quest: correct totalGold');
  assert(result.allItems.length === 1, 'single quest: correct item count');
  assert(result.allItems[0] === 'sword', 'single quest: correct item ID');
}

{
  const pending = [
    { questId: 'q1', rewards: { experience: 50, gold: 20, items: ['health_potion'] } },
    { questId: 'q2', rewards: { experience: 100, gold: 45, items: ['iron_sword', 'shield'] } },
  ];
  const result = getPendingRewardsTotal(pending);
  assert(result.totalXp === 150, 'multi-quest: sums totalXp correctly');
  assert(result.totalGold === 65, 'multi-quest: sums totalGold correctly');
  assert(result.allItems.length === 3, 'multi-quest: all items combined');
}

{
  // Quest with no items
  const pending = [{ questId: 'q1', rewards: { experience: 10, gold: 0 } }];
  const result = getPendingRewardsTotal(pending);
  assert(result.totalGold === 0, 'handles zero gold');
  assert(result.allItems.length === 0, 'handles missing items array gracefully');
}

{
  // Quest with no rewards object
  const pending = [{ questId: 'q1' }];
  const result = getPendingRewardsTotal(pending);
  assert(result.totalXp === 0, 'handles missing rewards object');
}

// ============================================================
// 3. claimAllQuestRewards
// ============================================================
console.log('\n--- claimAllQuestRewards ---');

{
  const player = { xp: 0, gold: 10, inventory: {} };
  const { playerState, messages } = claimAllQuestRewards(player, []);
  assert(playerState === player, 'no rewards: returns same player reference');
  assert(messages.length === 0, 'no rewards: returns empty messages');
}

{
  const { playerState, messages } = claimAllQuestRewards({ xp: 0, gold: 0 }, null);
  assert(messages.length === 0, 'null pending: returns empty messages');
}

{
  const player = { xp: 100, gold: 50, inventory: {} };
  const pending = [{ questId: 'q1', questName: 'Slay the Slime', rewards: { experience: 75, gold: 30, items: [] } }];
  const { playerState, messages } = claimAllQuestRewards(player, pending);
  assert(playerState.xp === 175, 'adds experience to player xp');
  assert(playerState.gold === 80, 'adds gold to player gold');
  assert(messages.some(m => m.includes('Slay the Slime')), 'messages include quest name');
}

{
  const player = { xp: 0, gold: 0, inventory: {} };
  const pending = [{ questId: 'q1', questName: 'Item Quest', rewards: { experience: 0, gold: 0, items: ['health_potion'] } }];
  const { playerState, messages } = claimAllQuestRewards(player, pending);
  assert(playerState.inventory && playerState.inventory['health_potion'] === 1, 'adds item to inventory');
}

{
  const player = { xp: 0, gold: 0, inventory: { health_potion: 2 } };
  const pending = [{ questId: 'q1', questName: 'Q1', rewards: { experience: 10, gold: 5, items: ['health_potion'] } }];
  const { playerState } = claimAllQuestRewards(player, pending);
  assert(playerState.inventory['health_potion'] === 3, 'stacks items already in inventory');
}

{
  const player = { xp: 0, gold: 0, inventory: {} };
  const pending = [
    { questId: 'q1', questName: 'Quest One', rewards: { experience: 50, gold: 10, items: [] } },
    { questId: 'q2', questName: 'Quest Two', rewards: { experience: 100, gold: 25, items: ['iron_sword'] } },
  ];
  const { playerState, messages } = claimAllQuestRewards(player, pending);
  assert(playerState.xp === 150, 'multi-quest: total xp accumulated');
  assert(playerState.gold === 35, 'multi-quest: total gold accumulated');
  assert(messages.some(m => m.includes('Quest One')), 'multi-quest: first quest in messages');
  assert(messages.some(m => m.includes('Quest Two')), 'multi-quest: second quest in messages');
}

{
  // Quest with no rewards at all (just completes) should add completion message
  const player = { xp: 0, gold: 0, inventory: {} };
  const pending = [{ questId: 'q1', questName: 'Empty Rewards Quest', rewards: {} }];
  const { playerState, messages } = claimAllQuestRewards(player, pending);
  assert(messages.some(m => m.includes('Empty Rewards Quest')), 'adds completion message for no-reward quest');
}

// ============================================================
// 4. hasPendingRewards
// ============================================================
console.log('\n--- hasPendingRewards ---');

assert(hasPendingRewards([{ questId: 'q1' }]) === true, 'returns true for non-empty array');
assert(hasPendingRewards([]) === false, 'returns false for empty array');
assert(hasPendingRewards(null) === false, 'returns false for null');
assert(hasPendingRewards(undefined) === false, 'returns false for undefined');
assert(hasPendingRewards('not-array') === false, 'returns false for non-array string');
assert(hasPendingRewards({}) === false, 'returns false for object (not array)');

{
  const multi = [{ questId: 'q1' }, { questId: 'q2' }];
  assert(hasPendingRewards(multi) === true, 'returns true for multi-element array');
}

// ============================================================
// 5. formatRewardItemName
// ============================================================
console.log('\n--- formatRewardItemName ---');

assert(formatRewardItemName('health_potion') === 'Health Potion', 'snake_case two words');
assert(formatRewardItemName('iron_sword') === 'Iron Sword', 'snake_case weapon');
assert(formatRewardItemName('mana_potion') === 'Mana Potion', 'mana_potion');
assert(formatRewardItemName('great_fire_orb') === 'Great Fire Orb', 'three-word snake_case');
assert(formatRewardItemName('sword') === 'Sword', 'single word capitalize');
assert(formatRewardItemName('') === '', 'empty string returns empty string');
assert(formatRewardItemName(null) === '', 'null returns empty string');
assert(formatRewardItemName(undefined) === '', 'undefined returns empty string');
assert(formatRewardItemName('UPPER_CASE') === 'UPPER CASE', 'uppercase words preserved');
assert(formatRewardItemName('mixed_Case_WORD') === 'Mixed Case WORD', 'mixed case: capitalizes first char');

// ============================================================
// 6. renderQuestCompletionCard (UI)
// ============================================================
console.log('\n--- renderQuestCompletionCard ---');

{
  const pending = { questId: 'q1', questName: 'Slay Slimes', rewards: { experience: 50, gold: 20, items: [] } };
  const html = renderQuestCompletionCard(pending);
  assert(typeof html === 'string', 'returns a string');
  assert(html.includes('Slay Slimes'), 'contains quest name');
  assert(html.includes('50'), 'contains XP amount');
  assert(html.includes('20'), 'contains gold amount');
  assert(html.includes('quest-completion-card'), 'has correct CSS class');
  assert(html.includes('Quest Complete'), 'shows Quest Complete header');
}

{
  // XSS safety
  const pending = { questId: 'q1', questName: '<script>alert(1)</script>', rewards: { experience: 0, gold: 0, items: [] } };
  const html = renderQuestCompletionCard(pending);
  assert(!html.includes('<script>'), 'escapes script tags in quest name');
  assert(html.includes('&lt;script&gt;'), 'HTML-encodes < and > in quest name');
}

{
  const pending = { questId: 'q1', questName: 'Item Quest', rewards: { experience: 0, gold: 0, items: ['health_potion'] } };
  const html = renderQuestCompletionCard(pending);
  assert(html.includes('Health Potion'), 'shows formatted item name');
  assert(html.includes('item-reward'), 'has item-reward CSS class');
}

{
  // No rewards case
  const pending = { questId: 'q1', questName: 'Nothing', rewards: { experience: 0, gold: 0, items: [] } };
  const html = renderQuestCompletionCard(pending);
  assert(html.includes('quest-completion-card'), 'renders card even with no rewards');
}

// ============================================================
// 7. renderQuestRewardScreen (UI)
// ============================================================
console.log('\n--- renderQuestRewardScreen ---');

{
  const html = renderQuestRewardScreen([]);
  assert(typeof html === 'string', 'returns string for empty array');
  assert(html.includes('No pending rewards'), 'empty array shows no-pending message');
}

{
  const html = renderQuestRewardScreen(null);
  assert(html.includes('No pending rewards'), 'null shows no-pending message');
}

{
  const pending = [{ questId: 'q1', questName: 'Q1', rewards: { experience: 50, gold: 20, items: [] } }];
  const html = renderQuestRewardScreen(pending);
  assert(html.includes('quest-reward-screen'), 'has correct container class');
  assert(html.includes('Q1'), 'shows quest name');
}

{
  const pending = [
    { questId: 'q1', questName: 'Quest One', rewards: { experience: 50, gold: 10, items: [] } },
    { questId: 'q2', questName: 'Quest Two', rewards: { experience: 100, gold: 25, items: [] } },
  ];
  const html = renderQuestRewardScreen(pending);
  assert(html.includes('Quest One'), 'shows first quest');
  assert(html.includes('Quest Two'), 'shows second quest');
  assert(html.includes('Total Rewards'), 'shows totals section for multiple quests');
  assert(html.includes('150'), 'totals show combined XP');
}

// ============================================================
// 8. renderQuestRewardActions (UI)
// ============================================================
console.log('\n--- renderQuestRewardActions ---');

{
  const html = renderQuestRewardActions();
  assert(typeof html === 'string', 'returns string');
  assert(html.includes('btnClaimRewards'), 'has claim button ID');
  assert(html.includes('Claim Rewards'), 'has correct button text');
  assert(html.includes('quest-reward-actions'), 'has correct container class');
}

// ============================================================
// 9. getQuestRewardStyles (UI)
// ============================================================
console.log('\n--- getQuestRewardStyles ---');

{
  const css = getQuestRewardStyles();
  assert(typeof css === 'string', 'returns a string');
  assert(css.length > 100, 'returns substantial CSS (>100 chars)');
  assert(css.includes('.quest-reward-screen'), 'defines quest-reward-screen style');
  assert(css.includes('.quest-completion-card'), 'defines quest-completion-card style');
  assert(css.includes('.btn-claim-rewards'), 'defines btn-claim-rewards style');
  assert(css.includes('.quest-reward-actions'), 'defines quest-reward-actions style');
}

// ============================================================
// 10. Integration / Source Code Checks
// ============================================================
console.log('\n--- Integration & Source Code Checks ---');

{
  const src = readFileSync(new URL('../src/quest-rewards.js', import.meta.url), 'utf8');
  assert(src.includes('buildPendingRewards'), 'quest-rewards.js exports buildPendingRewards');
  assert(src.includes('getPendingRewardsTotal'), 'quest-rewards.js exports getPendingRewardsTotal');
  assert(src.includes('claimAllQuestRewards'), 'quest-rewards.js exports claimAllQuestRewards');
  assert(src.includes('hasPendingRewards'), 'quest-rewards.js exports hasPendingRewards');
  assert(src.includes('formatRewardItemName'), 'quest-rewards.js exports formatRewardItemName');
  assert(src.includes("from './quest-integration.js'"), 'quest-rewards.js imports from quest-integration.js');
}

{
  const src = readFileSync(new URL('../src/quest-rewards-ui.js', import.meta.url), 'utf8');
  assert(src.includes('renderQuestCompletionCard'), 'quest-rewards-ui.js defines renderQuestCompletionCard');
  assert(src.includes('renderQuestRewardScreen'), 'quest-rewards-ui.js defines renderQuestRewardScreen');
  assert(src.includes('renderQuestRewardActions'), 'quest-rewards-ui.js defines renderQuestRewardActions');
  assert(src.includes('attachQuestRewardHandlers'), 'quest-rewards-ui.js defines attachQuestRewardHandlers');
  assert(src.includes('getQuestRewardStyles'), 'quest-rewards-ui.js defines getQuestRewardStyles');
  // Only ONE export block
  const exportMatches = (src.match(/^export\s*\{/gm) || []).length;
  assert(exportMatches === 1, 'quest-rewards-ui.js has exactly one export block');
}

{
  const src = readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
  assert(src.includes('getQuestRewardStyles'), 'render.js imports getQuestRewardStyles');
  assert(src.includes('attachQuestRewardHandlers'), 'render.js imports attachQuestRewardHandlers');
  assert(src.includes("phase === 'quest-reward'"), "render.js handles 'quest-reward' phase");
}

{
  const src = readFileSync(new URL('../src/handlers/ui-handler.js', import.meta.url), 'utf8');
  assert(src.includes('CLAIM_QUEST_REWARDS'), 'ui-handler.js handles CLAIM_QUEST_REWARDS action');
}

{
  const src = readFileSync(new URL('../src/handlers/exploration-handler.js', import.meta.url), 'utf8');
  assert(src.includes('buildPendingRewards'), 'exploration-handler.js calls buildPendingRewards');
  assert(src.includes('quest-reward'), "exploration-handler.js transitions to 'quest-reward' phase");
}

// ============================================================
// Summary
// ============================================================
console.log(`\n==========================================`);
console.log(`Quest Rewards System Tests: ${passed} passed, ${failed} failed`);
console.log(`==========================================`);

process.exit(failed > 0 ? 1 : 0);
