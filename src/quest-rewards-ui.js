/**
 * Quest Rewards UI — AI Village RPG
 * Owner: Claude Sonnet 4.6
 *
 * Renders the quest completion reward screen shown when the player
 * finishes a quest. Displays quest name, rewards breakdown, and
 * a "Claim Rewards" button.
 */

import { getPendingRewardsTotal, formatRewardItemName } from './quest-rewards.js';

/**
 * Escape HTML special characters to prevent XSS.
 * @param {*} str
 * @returns {string}
 */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render a single quest completion card.
 * @param {Object} pending - { questId, questName, rewards: { experience, gold, items } }
 * @returns {string} HTML string
 */
function renderQuestCompletionCard(pending) {
  const { questName, rewards } = pending;
  const r = rewards || {};
  const rewardLines = [];

  if (r.experience && r.experience > 0) {
    rewardLines.push(
      '<div class="quest-reward-row xp-reward">' +
        '<span class="reward-icon">✨</span>' +
        '<span class="reward-amount">+' + esc(r.experience) + ' XP</span>' +
      '</div>'
    );
  }

  if (r.gold && r.gold > 0) {
    rewardLines.push(
      '<div class="quest-reward-row gold-reward">' +
        '<span class="reward-icon">💰</span>' +
        '<span class="reward-amount">+' + esc(r.gold) + ' Gold</span>' +
      '</div>'
    );
  }

  if (Array.isArray(r.items) && r.items.length > 0) {
    for (const item of r.items) {
      rewardLines.push(
        '<div class="quest-reward-row item-reward">' +
          '<span class="reward-icon">🎁</span>' +
          '<span class="reward-amount">' + esc(formatRewardItemName(item)) + '</span>' +
        '</div>'
      );
    }
  }

  const rewardsHtml = rewardLines.length > 0
    ? rewardLines.join('')
    : '<div class="quest-reward-row"><span class="reward-icon">📜</span><span class="reward-amount">Quest completed!</span></div>';

  return (
    '<div class="quest-completion-card">' +
      '<div class="quest-complete-header">' +
        '<span class="quest-complete-icon">🏆</span>' +
        '<span class="quest-complete-title">Quest Complete!</span>' +
      '</div>' +
      '<div class="quest-complete-name">' + esc(questName) + '</div>' +
      '<div class="quest-rewards-list">' +
        rewardsHtml +
      '</div>' +
    '</div>'
  );
}

/**
 * Render the full quest reward screen for display in the HUD.
 * Shows all completed quests and a totals summary.
 *
 * @param {Array} pendingRewards - Array of { questId, questName, rewards }
 * @returns {string} HTML string for the HUD area
 */
function renderQuestRewardScreen(pendingRewards) {
  if (!pendingRewards || pendingRewards.length === 0) {
    return '<div class="quest-reward-screen"><p>No pending rewards.</p></div>';
  }

  const totals = getPendingRewardsTotal(pendingRewards);
  const cards = pendingRewards.map(renderQuestCompletionCard).join('');

  let totalsHtml = '';
  if (pendingRewards.length > 1) {
    const totalLines = [];
    if (totals.totalXp > 0) {
      totalLines.push('<span class="total-xp">✨ ' + totals.totalXp + ' XP</span>');
    }
    if (totals.totalGold > 0) {
      totalLines.push('<span class="total-gold">💰 ' + totals.totalGold + ' Gold</span>');
    }
    if (totals.allItems.length > 0) {
      totalLines.push('<span class="total-items">🎁 ' + totals.allItems.length + ' item(s)</span>');
    }
    if (totalLines.length > 0) {
      totalsHtml =
        '<div class="quest-rewards-totals">' +
          '<div class="totals-label">Total Rewards</div>' +
          '<div class="totals-row">' + totalLines.join(' &nbsp; ') + '</div>' +
        '</div>';
    }
  }

  return (
    '<div class="quest-reward-screen">' +
      '<div class="quest-reward-scroll">' +
        cards +
        totalsHtml +
      '</div>' +
    '</div>'
  );
}

/**
 * Render the action button HTML for the quest reward phase.
 * @returns {string} HTML string for the actions area
 */
function renderQuestRewardActions() {
  return (
    '<div class="quest-reward-actions">' +
      '<button id="btnClaimRewards" class="btn-claim-rewards">Claim Rewards</button>' +
    '</div>'
  );
}

/**
 * Attach event handlers for the quest reward screen.
 * @param {Function} dispatch - State dispatch function
 */
function attachQuestRewardHandlers(dispatch) {
  const btn = document.getElementById('btnClaimRewards');
  if (btn) {
    btn.onclick = () => dispatch({ type: 'CLAIM_QUEST_REWARDS' });
  }
}

/**
 * Returns CSS styles for the quest reward screen.
 * @returns {string} CSS string
 */
function getQuestRewardStyles() {
  return `
    .quest-reward-screen {
      padding: 0.5em;
      max-height: 60vh;
      overflow-y: auto;
    }
    .quest-reward-scroll {
      display: flex;
      flex-direction: column;
      gap: 0.75em;
    }
    .quest-completion-card {
      background: linear-gradient(135deg, #1a2a1a 0%, #243024 100%);
      border: 2px solid #4a8c4a;
      border-radius: 6px;
      padding: 0.75em 1em;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    .quest-complete-header {
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin-bottom: 0.35em;
    }
    .quest-complete-icon {
      font-size: 1.3em;
    }
    .quest-complete-title {
      font-size: 1em;
      font-weight: bold;
      color: #f0c040;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .quest-complete-name {
      font-size: 1.05em;
      color: #c8e6c9;
      margin-bottom: 0.6em;
      font-style: italic;
    }
    .quest-rewards-list {
      display: flex;
      flex-direction: column;
      gap: 0.2em;
    }
    .quest-reward-row {
      display: flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.15em 0;
    }
    .reward-icon {
      font-size: 1em;
      min-width: 1.4em;
      text-align: center;
    }
    .reward-amount {
      font-size: 0.95em;
      color: #e0e0e0;
    }
    .xp-reward .reward-amount { color: #a0d0ff; }
    .gold-reward .reward-amount { color: #f0c040; }
    .item-reward .reward-amount { color: #c8a0e0; }
    .quest-rewards-totals {
      background: rgba(255,255,255,0.06);
      border: 1px solid #555;
      border-radius: 4px;
      padding: 0.5em 0.75em;
    }
    .totals-label {
      font-size: 0.8em;
      color: #aaa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.3em;
    }
    .totals-row {
      display: flex;
      gap: 1em;
      flex-wrap: wrap;
    }
    .total-xp { color: #a0d0ff; font-weight: bold; }
    .total-gold { color: #f0c040; font-weight: bold; }
    .total-items { color: #c8a0e0; font-weight: bold; }
    .quest-reward-actions {
      display: flex;
      justify-content: center;
      padding: 0.5em;
    }
    .btn-claim-rewards {
      padding: 0.6em 2em;
      background: linear-gradient(135deg, #2a6a2a 0%, #3a8a3a 100%);
      color: #fff;
      border: 2px solid #5aaa5a;
      border-radius: 4px;
      font-size: 1em;
      cursor: pointer;
      font-weight: bold;
      letter-spacing: 0.05em;
      transition: background 0.2s;
    }
    .btn-claim-rewards:hover {
      background: linear-gradient(135deg, #3a8a3a 0%, #4aaa4a 100%);
    }
  `;
}

export {
  renderQuestCompletionCard,
  renderQuestRewardScreen,
  renderQuestRewardActions,
  attachQuestRewardHandlers,
  getQuestRewardStyles
};
