/**
 * Tests for src/stats-display.js
 */
import { renderStatsPanel, getStatsPanelStyles } from '../src/stats-display.js';
import { createGameStats, recordEnemyDefeated, recordDamageDealt, recordDamageReceived,
         recordBattleWon, recordBattleFled, recordItemUsed, recordAbilityUsed,
         recordGoldEarned, recordXPEarned, recordTurnPlayed } from '../src/game-stats.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

// --- renderStatsPanel with empty stats ---
console.log('[stats-display-test] renderStatsPanel with empty gameStats');
{
  const html = renderStatsPanel({});
  assert(typeof html === 'string', 'returns a string');
  assert(html.includes('Run Statistics') || html.includes('Statistics'), 'includes default title');
  assert(html.includes('Battles Won'), 'includes battlesWon label');
  assert(html.includes('Enemies Defeated'), 'includes enemiesDefeated label');
  assert(html.includes('Turns Played'), 'includes turnsPlayed label');
  assert(html.includes('Gold Earned'), 'includes goldEarned label');
  assert(html.includes('XP Earned'), 'includes xpEarned label');
}

// --- renderStatsPanel with real stats ---
console.log('[stats-display-test] renderStatsPanel with populated stats');
{
  let gs = createGameStats();
  gs = recordEnemyDefeated(gs, 'Goblin');
  gs = recordEnemyDefeated(gs, 'Goblin');
  gs = recordEnemyDefeated(gs, 'Slime');
  gs = recordDamageDealt(gs, 150);
  gs = recordDamageReceived(gs, 75);
  gs = recordBattleWon(gs);
  gs = recordBattleWon(gs);
  gs = recordBattleFled(gs);
  gs = recordItemUsed(gs, 'potion');
  gs = recordAbilityUsed(gs, 'fireball');
  gs = recordGoldEarned(gs, 200);
  gs = recordXPEarned(gs, 500);
  gs = recordTurnPlayed(gs);
  gs = recordTurnPlayed(gs);
  gs = recordTurnPlayed(gs);

  const html = renderStatsPanel(gs);
  assert(html.includes('2'), 'includes battle won count (2)');
  assert(html.includes('3'), 'includes enemies defeated count (3)');
  assert(html.includes('Goblin'), 'includes nemesis enemy name');
  assert(html.includes('150'), 'includes damage dealt value');
  assert(html.includes('75'), 'includes damage received value');
  assert(html.includes('2.0'), 'includes damage ratio');
  assert(html.includes('200'), 'includes gold earned');
  assert(html.includes('500'), 'includes xp earned');
  assert(html.includes('3'), 'includes turns played');
}

// --- renderStatsPanel custom title ---
console.log('[stats-display-test] renderStatsPanel custom title');
{
  const html = renderStatsPanel({}, { title: 'Adventure Statistics' });
  assert(html.includes('Adventure Statistics'), 'uses custom title');
}

// --- renderStatsPanel compact mode ---
console.log('[stats-display-test] renderStatsPanel compact mode');
{
  const html = renderStatsPanel({}, { compact: true });
  assert(typeof html === 'string', 'compact mode returns a string');
  assert(!html.includes('Total Damage Dealt'), 'compact mode omits damage dealt detail');
  assert(!html.includes('Abilities Used'), 'compact mode omits abilities used detail');
}

// --- renderStatsPanel HTML escaping ---
console.log('[stats-display-test] renderStatsPanel HTML escaping');
{
  let gs = createGameStats();
  gs = recordEnemyDefeated(gs, '<script>alert("xss")</script>');
  const html = renderStatsPanel(gs);
  assert(!html.includes('<script>'), 'escapes HTML in enemy name');
  assert(html.includes('&lt;script&gt;'), 'correctly HTML-encodes script tags');
}

// --- renderStatsPanel infinite damage ratio ---
console.log('[stats-display-test] renderStatsPanel infinite damage ratio');
{
  let gs = createGameStats();
  gs = recordDamageDealt(gs, 100);
  // No damage received -> damageRatio should be '∞'
  const html = renderStatsPanel(gs);
  assert(html.includes('∞'), 'shows infinity symbol when no damage received');
}

// --- renderStatsPanel damage ratio color classes ---
console.log('[stats-display-test] renderStatsPanel damage ratio CSS classes');
{
  let highRatioGs = createGameStats();
  highRatioGs = recordDamageDealt(highRatioGs, 300);
  highRatioGs = recordDamageReceived(highRatioGs, 100);
  const htmlHigh = renderStatsPanel(highRatioGs);
  assert(htmlHigh.includes('class="good"') || htmlHigh.includes("class='good'"), 'high ratio (3.0) gets good class');

  let lowRatioGs = createGameStats();
  lowRatioGs = recordDamageDealt(lowRatioGs, 50);
  lowRatioGs = recordDamageReceived(lowRatioGs, 200);
  const htmlLow = renderStatsPanel(lowRatioGs);
  assert(htmlLow.includes('class="bad"') || htmlLow.includes("class='bad'"), 'low ratio (0.25) gets bad class');
}

// --- getStatsPanelStyles ---
console.log('[stats-display-test] getStatsPanelStyles');
{
  const css = getStatsPanelStyles();
  assert(typeof css === 'string', 'returns a string');
  assert(css.includes('.stats-panel'), 'includes .stats-panel class');
  assert(css.length > 0, 'non-empty CSS');
}

// --- Summary ---
console.log(`\n[stats-display-test] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
