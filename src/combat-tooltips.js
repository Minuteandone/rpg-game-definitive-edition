/**
 * Combat Tooltips Module — AI Village RPG
 * Owner: Claude Opus 4.5
 *
 * Provides informative tooltips for combat abilities, items, and actions.
 * Displays ability details like MP cost, damage formula, status effects, etc.
 */

import { getAbility } from './combat/abilities.js';
import { items } from './data/items.js';

// ── Element Display Names & Icons ────────────────────────────────────
const ELEMENT_DISPLAY = {
  physical: { name: 'Physical', icon: '⚔️' },
  fire: { name: 'Fire', icon: '🔥' },
  ice: { name: 'Ice', icon: '❄️' },
  lightning: { name: 'Lightning', icon: '⚡' },
  light: { name: 'Light', icon: '✨' },
  dark: { name: 'Dark', icon: '🌑' },
  earth: { name: 'Earth', icon: '🪨' },
};

// ── Target Type Display ──────────────────────────────────────────────
const TARGET_DISPLAY = {
  'single-enemy': 'Single Enemy',
  'single-ally': 'Single Ally',
  'all-enemies': 'All Enemies',
  'all-allies': 'All Allies',
  'self': 'Self',
};

// ── Status Effect Display ────────────────────────────────────────────
const STATUS_ICONS = {
  poison: '☠️',
  burn: '🔥',
  stun: '💫',
  sleep: '💤',
  regen: '💚',
  'atk-up': '⚔️↑',
  'def-up': '🛡️↑',
  'spd-up': '💨↑',
  'atk-down': '⚔️↓',
  'def-down': '🛡️↓',
  'spd-down': '💨↓',
};

// ── Tooltip Generation Functions ─────────────────────────────────────

/**
 * Generate tooltip content for an ability.
 * @param {string} abilityId - The ability ID
 * @param {number} [currentMp=0] - Player's current MP for affordability display
 * @returns {Object|null} Tooltip data object or null if ability not found
 */
export function getAbilityTooltip(abilityId, currentMp = 0) {
  const ability = getAbility(abilityId);
  if (!ability) return null;

  const element = ELEMENT_DISPLAY[ability.element] || { name: ability.element, icon: '❓' };
  const target = TARGET_DISPLAY[ability.targetType] || ability.targetType;
  const canAfford = currentMp >= ability.mpCost;

  const tooltip = {
    id: ability.id,
    name: ability.name,
    description: ability.description,
    mpCost: ability.mpCost,
    canAfford,
    element: element.name,
    elementIcon: element.icon,
    target,
    class: ability.class,
    lines: [],
  };

  // Build tooltip lines
  tooltip.lines.push(`📖 ${ability.description}`);
  tooltip.lines.push(`💎 MP Cost: ${ability.mpCost}${canAfford ? '' : ' (Not enough MP!)'}`);
  tooltip.lines.push(`${element.icon} Element: ${element.name}`);
  tooltip.lines.push(`🎯 Target: ${target}`);

  // Damage info
  if (ability.power > 0) {
    const powerPercent = Math.round(ability.power * 100);
    tooltip.lines.push(`💥 Damage: ${powerPercent}% ATK`);
    tooltip.power = ability.power;
  }

  // Healing info
  if (ability.healPower > 0) {
    tooltip.lines.push(`💖 Heals: ${ability.healPower} HP`);
    tooltip.healPower = ability.healPower;
  }

  // Status effect info
  if (ability.statusEffect) {
    const se = ability.statusEffect;
    const seIcon = STATUS_ICONS[se.type] || '❓';
    let seText = `${seIcon} Applies: ${se.name} (${se.duration} turn${se.duration > 1 ? 's' : ''})`;
    if (se.power > 0) {
      seText += ` - ${se.power} dmg/turn`;
    }
    tooltip.lines.push(seText);
    tooltip.statusEffect = se;
  }

  // Special flags
  if (ability.special === 'cleanse') {
    tooltip.lines.push(`🧹 Special: Removes negative status effects`);
  }

  return tooltip;
}

/**
 * Generate tooltip content for a combat item.
 * @param {string} itemId - The item ID
 * @returns {Object|null} Tooltip data object or null if item not found
 */
export function getItemTooltip(itemId) {
  const item = items[itemId];
  if (!item) return null;

  const tooltip = {
    id: itemId,
    name: item.name,
    description: item.description || '',
    type: item.type,
    lines: [],
  };

  tooltip.lines.push(`📖 ${item.description || 'A useful item.'}`);
  tooltip.lines.push(`📦 Type: ${item.type}`);

  if (item.effect) {
    if (item.effect.heal) {
      tooltip.lines.push(`💖 Heals: ${item.effect.heal} HP`);
    }
    if (item.effect.mana) {
      tooltip.lines.push(`💎 Restores: ${item.effect.mana} MP`);
    }
    if (item.effect.damage) {
      const element = item.effect.element || 'physical';
      const elemDisplay = ELEMENT_DISPLAY[element] || { icon: '❓', name: element };
      tooltip.lines.push(`💥 Damage: ${item.effect.damage} ${elemDisplay.icon} ${elemDisplay.name}`);
    }
    if (item.effect.cleanse) {
      tooltip.lines.push(`🧹 Removes negative status effects`);
    }
  }

  if (item.value !== undefined) {
    tooltip.lines.push(`💰 Value: ${item.value} gold`);
  }

  return tooltip;
}

/**
 * Generate tooltip for basic combat actions.
 * @param {string} action - 'attack', 'defend', or 'flee'
 * @returns {Object} Tooltip data object
 */
export function getActionTooltip(action) {
  const tooltips = {
    attack: {
      name: 'Attack',
      lines: [
        '⚔️ Basic Attack',
        '💥 Deal physical damage based on ATK vs enemy DEF',
        '💎 MP Cost: 0',
        '📖 A reliable strike. Damage = ATK - DEF (min 1)',
      ],
    },
    defend: {
      name: 'Defend',
      lines: [
        '🛡️ Defend',
        '🛡️ Reduce incoming damage by 50%',
        '💎 MP Cost: 0',
        '📖 Brace for impact. Halves damage until your next turn.',
      ],
    },
    flee: {
      name: 'Flee',
      lines: [
        '🏃 Flee',
        '📖 Attempt to escape from battle',
        '⚠️ May not always succeed',
      ],
    },
  };

  return tooltips[action] || { name: action, lines: [`📖 ${action}`] };
}

/**
 * Format tooltip lines into a single string for display.
 * @param {Object} tooltip - Tooltip object with lines array
 * @param {string} [separator='\n'] - Line separator
 * @returns {string} Formatted tooltip text
 */
export function formatTooltipText(tooltip, separator = '\n') {
  if (!tooltip || !tooltip.lines) return '';
  return tooltip.lines.join(separator);
}

/**
 * Get all ability tooltips for a list of ability IDs.
 * @param {string[]} abilityIds - Array of ability IDs
 * @param {number} [currentMp=0] - Player's current MP
 * @returns {Object[]} Array of tooltip objects
 */
export function getAbilityTooltips(abilityIds, currentMp = 0) {
  return abilityIds
    .map(id => getAbilityTooltip(id, currentMp))
    .filter(Boolean);
}

/**
 * Create HTML tooltip element content.
 * @param {Object} tooltip - Tooltip data object
 * @returns {string} HTML string for tooltip content
 */
export function createTooltipHTML(tooltip) {
  if (!tooltip) return '';
  
  const nameClass = tooltip.canAfford === false ? 'tooltip-name disabled' : 'tooltip-name';
  let html = `<div class="combat-tooltip">`;
  html += `<div class="${nameClass}">${tooltip.name}</div>`;
  html += `<div class="tooltip-body">`;
  
  for (const line of tooltip.lines) {
    html += `<div class="tooltip-line">${line}</div>`;
  }
  
  html += `</div></div>`;
  return html;
}

// ── Export for testing ───────────────────────────────────────────────
export const _internal = {
  ELEMENT_DISPLAY,
  TARGET_DISPLAY,
  STATUS_ICONS,
};
