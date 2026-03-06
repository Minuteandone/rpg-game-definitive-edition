/**
 * Stats Display UI Module
 * Renders game statistics summary for the player.
 * Uses data from game-stats.js getStatsSummary().
 */

/**
 * Format a stat row for display
 * @param {string} label - The stat label
 * @param {string|number} value - The stat value
 * @returns {string} HTML for the stat row
 */
export function formatStatRow(label, value) {
  const escaped = String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-value">${escaped}</span></div>`;
}

/**
 * Format a section header
 * @param {string} title - Section title
 * @returns {string} HTML for section header
 */
export function formatSectionHeader(title) {
  return `<div class="stat-section-header">${title}</div>`;
}

/**
 * Render the full stats display HTML
 * @param {Object} summary - Stats summary from getStatsSummary()
 * @returns {string} Complete stats panel HTML
 */
export function renderStatsPanel(summary) {
  if (!summary) {
    return '<div class="stats-panel"><p>No statistics available yet.</p></div>';
  }

  const combatSection = [
    formatSectionHeader('⚔️ Combat'),
    formatStatRow('Enemies Defeated', summary.enemiesDefeated),
    formatStatRow('Most Defeated', summary.mostDefeated),
    formatStatRow('Damage Dealt', summary.totalDamageDealt),
    formatStatRow('Damage Received', summary.totalDamageReceived),
    formatStatRow('Damage Ratio', summary.damageRatio),
  ].join('\n');

  const battleSection = [
    formatSectionHeader('🏆 Battles'),
    formatStatRow('Battles Won', summary.battlesWon),
    formatStatRow('Battles Fled', summary.battlesFled),
    formatStatRow('Turns Played', summary.turnsPlayed),
  ].join('\n');

  const resourceSection = [
    formatSectionHeader('📦 Resources'),
    formatStatRow('Items Used', summary.itemsUsed),
    formatStatRow('Abilities Used', summary.abilitiesUsed),
    formatStatRow('Gold Earned', summary.goldEarned),
    formatStatRow('XP Earned', summary.xpEarned),
  ].join('\n');

  return `<div class="stats-panel">
    <h2>📊 Game Statistics</h2>
    ${combatSection}
    ${battleSection}
    ${resourceSection}
  </div>`;
}

/**
 * Get CSS styles for the stats display
 * @returns {string} CSS stylesheet content
 */
export function getStatsDisplayStyles() {
  return `
    .stats-panel {
      padding: 16px;
      max-width: 400px;
    }
    .stats-panel h2 {
      margin: 0 0 16px 0;
      font-size: 1.4em;
      border-bottom: 2px solid #555;
      padding-bottom: 8px;
    }
    .stat-section-header {
      font-weight: bold;
      margin: 16px 0 8px 0;
      font-size: 1.1em;
      color: #aaa;
    }
    .stat-section-header:first-of-type {
      margin-top: 0;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dotted #333;
    }
    .stat-label {
      color: #ccc;
    }
    .stat-value {
      font-weight: bold;
      color: #fff;
    }
  `;
}

/**
 * Create action buttons for stats screen
 * @returns {string} HTML for action buttons
 */
export function getStatsActions() {
  return '<button data-action="CLOSE_STATS">Close</button>';
}
