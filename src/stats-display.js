/**
 * Stats Display UI Module
 * Renders a formatted HTML panel surfacing getStatsSummary() results.
 * Used on the defeat screen, game-over screen, and the dedicated stats view.
 */

import { getStatsSummary, createGameStats } from './game-stats.js';

/**
 * Escapes HTML special characters.
 * @param {*} s
 * @returns {string}
 */
function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Renders a stats summary card as an HTML string.
 * @param {object} gameStats - The raw gameStats object from state
 * @param {object} [options]
 * @param {string} [options.title] - Card title (default: 'Run Statistics')
 * @param {boolean} [options.compact] - If true, show a shorter version
 * @returns {string} HTML string
 */
export function renderStatsPanel(gameStats, options = {}) {
  const normalizedStats = { ...createGameStats(), ...(gameStats || {}) };
  const summary = getStatsSummary(normalizedStats);
  const title = options.title ?? 'Run Statistics';
  const compact = options.compact ?? false;

  const ratioClass = parseFloat(summary.damageRatio) >= 1.5 || summary.damageRatio === '∞'
    ? 'good'
    : (parseFloat(summary.damageRatio) < 1.0 ? 'bad' : '');

  const battleOutcomeHtml = `
    <div>Battles Won</div><div><b class="good">${esc(summary.battlesWon)}</b></div>
    <div>Battles Fled</div><div><b>${esc(summary.battlesFled)}</b></div>
    <div>Enemies Defeated</div><div><b>${esc(summary.enemiesDefeated)}</b></div>
    <div>Nemesis</div><div><b>${esc(summary.mostDefeated)}</b></div>
  `;

  const combatDetailHtml = compact ? '' : `
    <div>Total Damage Dealt</div><div><b class="good">${esc(summary.totalDamageDealt)}</b></div>
    <div>Total Damage Taken</div><div><b class="bad">${esc(summary.totalDamageReceived)}</b></div>
    <div>Damage Ratio</div><div><b class="${esc(ratioClass)}">${esc(summary.damageRatio)}</b></div>
    <div>Abilities Used</div><div><b>${esc(summary.abilitiesUsed)}</b></div>
    <div>Items Used</div><div><b>${esc(summary.itemsUsed)}</b></div>
  `;

  const progressionHtml = `
    <div>XP Earned</div><div><b>${esc(summary.xpEarned)}</b></div>
    <div>Gold Earned</div><div><b>${esc(summary.goldEarned)}</b></div>
    <div>Turns Played</div><div><b>${esc(summary.turnsPlayed)}</b></div>
  `;

  return `
    <div class="card stats-panel">
      <h2>📊 ${esc(title)}</h2>
      <div class="kv">
        ${battleOutcomeHtml}
        ${combatDetailHtml}
        ${progressionHtml}
      </div>
    </div>
  `;
}

/**
 * Returns CSS styles for the stats panel.
 * @returns {string} CSS string
 */
export function getStatsPanelStyles() {
  return `
    .stats-panel { min-width: 220px; }
    .stats-panel h2 { margin-bottom: 8px; }
  `;
}
