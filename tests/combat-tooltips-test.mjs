/**
 * Combat Tooltips Tests — AI Village RPG
 * Owner: Claude Opus 4.5
 *
 * Tests for the combat tooltips module that provides informative
 * hover tooltips for abilities, items, and combat actions.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  getAbilityTooltip,
  getItemTooltip,
  getActionTooltip,
  formatTooltipText,
  getAbilityTooltips,
  createTooltipHTML,
  _internal,
} from '../src/combat-tooltips.js';

const { ELEMENT_DISPLAY, TARGET_DISPLAY, STATUS_ICONS } = _internal;

// ═══════════════════════════════════════════════════════════════════════
// ELEMENT DISPLAY TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('Element Display Constants', () => {
  it('should have all expected elements defined', () => {
    const expectedElements = ['physical', 'fire', 'ice', 'lightning', 'light', 'dark', 'earth'];
    for (const elem of expectedElements) {
      assert.ok(ELEMENT_DISPLAY[elem], `Element ${elem} should be defined`);
      assert.ok(ELEMENT_DISPLAY[elem].name, `Element ${elem} should have name`);
      assert.ok(ELEMENT_DISPLAY[elem].icon, `Element ${elem} should have icon`);
    }
  });

  it('should have correct element names', () => {
    assert.strictEqual(ELEMENT_DISPLAY.fire.name, 'Fire');
    assert.strictEqual(ELEMENT_DISPLAY.ice.name, 'Ice');
    assert.strictEqual(ELEMENT_DISPLAY.lightning.name, 'Lightning');
    assert.strictEqual(ELEMENT_DISPLAY.physical.name, 'Physical');
  });

  it('should have appropriate icons', () => {
    assert.strictEqual(ELEMENT_DISPLAY.fire.icon, '🔥');
    assert.strictEqual(ELEMENT_DISPLAY.ice.icon, '❄️');
    assert.strictEqual(ELEMENT_DISPLAY.lightning.icon, '⚡');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TARGET DISPLAY TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('Target Display Constants', () => {
  it('should have all target types defined', () => {
    const expectedTargets = ['single-enemy', 'single-ally', 'all-enemies', 'all-allies', 'self'];
    for (const target of expectedTargets) {
      assert.ok(TARGET_DISPLAY[target], `Target ${target} should be defined`);
    }
  });

  it('should have human-readable target names', () => {
    assert.strictEqual(TARGET_DISPLAY['single-enemy'], 'Single Enemy');
    assert.strictEqual(TARGET_DISPLAY['all-allies'], 'All Allies');
    assert.strictEqual(TARGET_DISPLAY['self'], 'Self');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STATUS ICONS TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('Status Icons Constants', () => {
  it('should have icons for all status effects', () => {
    const expectedStatuses = [
      'poison', 'burn', 'stun', 'sleep', 'regen',
      'atk-up', 'def-up', 'spd-up', 'atk-down', 'def-down', 'spd-down'
    ];
    for (const status of expectedStatuses) {
      assert.ok(STATUS_ICONS[status], `Status ${status} should have an icon`);
    }
  });

  it('should have appropriate status icons', () => {
    assert.strictEqual(STATUS_ICONS.poison, '☠️');
    assert.strictEqual(STATUS_ICONS.stun, '💫');
    assert.strictEqual(STATUS_ICONS.regen, '💚');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getAbilityTooltip TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('getAbilityTooltip', () => {
  it('should return null for non-existent ability', () => {
    const result = getAbilityTooltip('non-existent-ability');
    assert.strictEqual(result, null);
  });

  it('should return tooltip for power-strike', () => {
    const tooltip = getAbilityTooltip('power-strike', 10);
    assert.ok(tooltip);
    assert.strictEqual(tooltip.name, 'Power Strike');
    assert.strictEqual(tooltip.mpCost, 4);
    assert.strictEqual(tooltip.canAfford, true);
    assert.strictEqual(tooltip.element, 'Physical');
    assert.strictEqual(tooltip.target, 'Single Enemy');
    assert.strictEqual(tooltip.class, 'warrior');
  });

  it('should show canAfford false when MP insufficient', () => {
    const tooltip = getAbilityTooltip('power-strike', 2);
    assert.strictEqual(tooltip.canAfford, false);
    assert.ok(tooltip.lines.some(l => l.includes('Not enough MP')));
  });

  it('should include damage info for damage abilities', () => {
    const tooltip = getAbilityTooltip('fireball', 10);
    assert.ok(tooltip);
    assert.ok(tooltip.power > 0);
    assert.ok(tooltip.lines.some(l => l.includes('Damage:')));
    assert.ok(tooltip.lines.some(l => l.includes('180%'))); // 1.8 power = 180%
  });

  it('should include healing info for heal abilities', () => {
    const tooltip = getAbilityTooltip('heal', 10);
    assert.ok(tooltip);
    assert.ok(tooltip.healPower > 0);
    assert.ok(tooltip.lines.some(l => l.includes('Heals:')));
  });

  it('should include status effect info for abilities with effects', () => {
    const tooltip = getAbilityTooltip('shield-bash', 10);
    assert.ok(tooltip);
    assert.ok(tooltip.statusEffect);
    assert.strictEqual(tooltip.statusEffect.type, 'stun');
    assert.ok(tooltip.lines.some(l => l.includes('Applies:')));
    assert.ok(tooltip.lines.some(l => l.includes('Stun')));
  });

  it('should show status effect duration', () => {
    const tooltip = getAbilityTooltip('poison-blade', 10);
    assert.ok(tooltip.lines.some(l => l.includes('3 turns')));
  });

  it('should show status effect power for DoT effects', () => {
    const tooltip = getAbilityTooltip('poison-blade', 10);
    assert.ok(tooltip.lines.some(l => l.includes('5 dmg/turn')));
  });

  it('should show cleanse special for purify', () => {
    const tooltip = getAbilityTooltip('purify', 10);
    assert.ok(tooltip.lines.some(l => l.includes('Removes negative status effects')));
  });

  it('should include element icon in lines', () => {
    const tooltip = getAbilityTooltip('fireball', 10);
    assert.ok(tooltip.elementIcon === '🔥');
    assert.ok(tooltip.lines.some(l => l.includes('🔥')));
  });

  it('should handle all-enemies target type', () => {
    const tooltip = getAbilityTooltip('blizzard', 20);
    assert.strictEqual(tooltip.target, 'All Enemies');
  });

  it('should handle self target type', () => {
    const tooltip = getAbilityTooltip('regenerate', 10);
    assert.strictEqual(tooltip.target, 'Self');
  });

  it('should default currentMp to 0', () => {
    const tooltip = getAbilityTooltip('fireball');
    assert.strictEqual(tooltip.canAfford, false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getItemTooltip TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('getItemTooltip', () => {
  it('should return null for non-existent item', () => {
    const result = getItemTooltip('non-existent-item');
    assert.strictEqual(result, null);
  });

  it('should return tooltip for potion', () => {
    const tooltip = getItemTooltip('potion');
    assert.ok(tooltip);
    assert.strictEqual(tooltip.name, 'Healing Potion');
    assert.ok(tooltip.lines.length > 0);
  });

  it('should show heal amount for healing items', () => {
    const tooltip = getItemTooltip('potion');
    if (tooltip) {
      assert.ok(tooltip.lines.some(l => l.includes('Heals:') || l.includes('HP')));
    }
  });

  it('should show mana restore for mana items', () => {
    const tooltip = getItemTooltip('ether');
    if (tooltip) {
      assert.ok(tooltip.lines.some(l => l.includes('Restores:') || l.includes('MP')));
    }
  });

  it('should show damage for damage items', () => {
    const tooltip = getItemTooltip('fire-bomb');
    if (tooltip) {
      assert.ok(tooltip.lines.some(l => l.includes('Damage:')));
    }
  });

  it('should show item value when present', () => {
    const tooltip = getItemTooltip('potion');
    if (tooltip) {
      assert.ok(tooltip.lines.some(l => l.includes('Value:') || l.includes('gold')));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getActionTooltip TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('getActionTooltip', () => {
  it('should return tooltip for attack action', () => {
    const tooltip = getActionTooltip('attack');
    assert.ok(tooltip);
    assert.strictEqual(tooltip.name, 'Attack');
    assert.ok(tooltip.lines.some(l => l.includes('physical damage')));
    assert.ok(tooltip.lines.some(l => l.includes('MP Cost: 0')));
  });

  it('should return tooltip for defend action', () => {
    const tooltip = getActionTooltip('defend');
    assert.ok(tooltip);
    assert.strictEqual(tooltip.name, 'Defend');
    assert.ok(tooltip.lines.some(l => l.includes('50%') || l.includes('Halves')));
  });

  it('should return tooltip for flee action', () => {
    const tooltip = getActionTooltip('flee');
    assert.ok(tooltip);
    assert.strictEqual(tooltip.name, 'Flee');
    assert.ok(tooltip.lines.some(l => l.includes('escape')));
  });

  it('should handle unknown actions gracefully', () => {
    const tooltip = getActionTooltip('unknown-action');
    assert.ok(tooltip);
    assert.strictEqual(tooltip.name, 'unknown-action');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// formatTooltipText TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('formatTooltipText', () => {
  it('should join lines with newline by default', () => {
    const tooltip = { lines: ['Line 1', 'Line 2', 'Line 3'] };
    const result = formatTooltipText(tooltip);
    assert.strictEqual(result, 'Line 1\nLine 2\nLine 3');
  });

  it('should use custom separator', () => {
    const tooltip = { lines: ['A', 'B', 'C'] };
    const result = formatTooltipText(tooltip, ' | ');
    assert.strictEqual(result, 'A | B | C');
  });

  it('should return empty string for null tooltip', () => {
    assert.strictEqual(formatTooltipText(null), '');
  });

  it('should return empty string for tooltip without lines', () => {
    assert.strictEqual(formatTooltipText({}), '');
  });

  it('should handle empty lines array', () => {
    assert.strictEqual(formatTooltipText({ lines: [] }), '');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getAbilityTooltips TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('getAbilityTooltips', () => {
  it('should return array of tooltips for valid abilities', () => {
    const result = getAbilityTooltips(['power-strike', 'fireball'], 10);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, 'Power Strike');
    assert.strictEqual(result[1].name, 'Fireball');
  });

  it('should filter out non-existent abilities', () => {
    const result = getAbilityTooltips(['power-strike', 'non-existent', 'heal'], 10);
    assert.strictEqual(result.length, 2);
  });

  it('should pass currentMp to each tooltip', () => {
    const result = getAbilityTooltips(['fireball', 'blizzard'], 8);
    // fireball costs 6, blizzard costs 10
    assert.strictEqual(result[0].canAfford, true);  // 8 >= 6
    assert.strictEqual(result[1].canAfford, false); // 8 < 10
  });

  it('should return empty array for empty input', () => {
    const result = getAbilityTooltips([], 10);
    assert.strictEqual(result.length, 0);
  });

  it('should handle all invalid abilities', () => {
    const result = getAbilityTooltips(['fake1', 'fake2'], 10);
    assert.strictEqual(result.length, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// createTooltipHTML TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('createTooltipHTML', () => {
  it('should return empty string for null tooltip', () => {
    assert.strictEqual(createTooltipHTML(null), '');
  });

  it('should create HTML with tooltip class', () => {
    const tooltip = { name: 'Test', lines: ['Line 1'], canAfford: true };
    const html = createTooltipHTML(tooltip);
    assert.ok(html.includes('class="combat-tooltip"'));
  });

  it('should include tooltip name', () => {
    const tooltip = { name: 'Fireball', lines: ['A fire spell'], canAfford: true };
    const html = createTooltipHTML(tooltip);
    assert.ok(html.includes('Fireball'));
  });

  it('should include all lines', () => {
    const tooltip = { name: 'Test', lines: ['Line A', 'Line B'], canAfford: true };
    const html = createTooltipHTML(tooltip);
    assert.ok(html.includes('Line A'));
    assert.ok(html.includes('Line B'));
  });

  it('should add disabled class when canAfford is false', () => {
    const tooltip = { name: 'Test', lines: [], canAfford: false };
    const html = createTooltipHTML(tooltip);
    assert.ok(html.includes('disabled'));
  });

  it('should not have disabled class when canAfford is true', () => {
    const tooltip = { name: 'Test', lines: [], canAfford: true };
    const html = createTooltipHTML(tooltip);
    assert.ok(!html.includes('disabled'));
  });

  it('should wrap lines in tooltip-line divs', () => {
    const tooltip = { name: 'Test', lines: ['Content'], canAfford: true };
    const html = createTooltipHTML(tooltip);
    assert.ok(html.includes('class="tooltip-line"'));
  });
});

// ═══════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS - Real Ability Data
// ═══════════════════════════════════════════════════════════════════════

describe('Integration: Warrior Abilities', () => {
  it('should generate tooltips for all warrior abilities', () => {
    const warriorAbilities = ['power-strike', 'shield-bash', 'war-cry'];
    const tooltips = getAbilityTooltips(warriorAbilities, 20);
    assert.strictEqual(tooltips.length, 3);
    tooltips.forEach(t => assert.strictEqual(t.class, 'warrior'));
  });
});

describe('Integration: Mage Abilities', () => {
  it('should generate tooltips for all mage abilities', () => {
    const mageAbilities = ['fireball', 'blizzard', 'thunder-bolt', 'arcane-shield'];
    const tooltips = getAbilityTooltips(mageAbilities, 20);
    assert.strictEqual(tooltips.length, 4);
    tooltips.forEach(t => assert.strictEqual(t.class, 'mage'));
  });
});

describe('Integration: Rogue Abilities', () => {
  it('should generate tooltips for all rogue abilities', () => {
    const rogueAbilities = ['backstab', 'poison-blade', 'smoke-bomb'];
    const tooltips = getAbilityTooltips(rogueAbilities, 20);
    assert.strictEqual(tooltips.length, 3);
    tooltips.forEach(t => assert.strictEqual(t.class, 'rogue'));
  });
});

describe('Integration: Cleric Abilities', () => {
  it('should generate tooltips for all cleric abilities', () => {
    const clericAbilities = ['heal', 'group-heal', 'smite', 'purify'];
    const tooltips = getAbilityTooltips(clericAbilities, 20);
    assert.strictEqual(tooltips.length, 4);
    tooltips.forEach(t => assert.strictEqual(t.class, 'cleric'));
  });
});

describe('Integration: Full Tooltip Flow', () => {
  it('should format ability tooltip to text correctly', () => {
    const tooltip = getAbilityTooltip('fireball', 10);
    const text = formatTooltipText(tooltip);
    assert.ok(text.includes('blazing fireball'));
    assert.ok(text.includes('MP Cost:'));
    assert.ok(text.includes('Fire'));
    assert.ok(text.includes('Damage:'));
  });

  it('should create HTML for action tooltip', () => {
    const tooltip = getActionTooltip('attack');
    const html = createTooltipHTML(tooltip);
    assert.ok(html.includes('Attack'));
    assert.ok(html.includes('combat-tooltip'));
  });
});
