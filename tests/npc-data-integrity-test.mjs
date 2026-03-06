import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRequire } from 'node:module';

import { EXPLORATION_QUESTS } from '../src/data/exploration-quests.js';

const require = createRequire(import.meta.url);
const { QUESTS } = require('../src/data/quests.js');
const { NPCS, NPC_TYPES } = require('../src/data/npcs.js');

const NPC_TYPE_KEYS = Object.keys(NPC_TYPES);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

describe('NPCS data integrity', () => {
  it('has NPCs with consistent basic fields', () => {
    const npcKeys = Object.keys(NPCS);
    assert.ok(npcKeys.length > 0, 'NPCS should contain at least one NPC');

    for (const key of npcKeys) {
      const npc = NPCS[key];
      assert.ok(npc, `NPC ${key} is defined`);
      assert.strictEqual(npc.id, key, `NPC id should match key for ${key}`);
      assert.ok(isNonEmptyString(npc.name), `NPC ${key} must have a name`);
      assert.ok(isNonEmptyString(npc.type), `NPC ${key} must have a type`);
      assert.ok(
        NPC_TYPE_KEYS.includes(npc.type),
        `NPC ${key} type ${npc.type} must be one of ${NPC_TYPE_KEYS.join(', ')}`
      );

      if (npc.location !== undefined) {
        assert.ok(isNonEmptyString(npc.location), `NPC ${key} location, when present, must be a non-empty string`);
      }

      if (npc.dialog !== undefined) {
        assert.ok(isNonEmptyString(npc.dialog), `NPC ${key} dialog, when present, must be a non-empty string`);
      }
    }
  });

  it('has quests on NPCs that reference existing quest definitions', () => {
    const npcKeys = Object.keys(NPCS);

    for (const key of npcKeys) {
      const npc = NPCS[key];
      if (!Array.isArray(npc.quests)) continue;

      for (const questId of npc.quests) {
        assert.ok(
          typeof questId === 'string' && (questId in QUESTS || questId in EXPLORATION_QUESTS),
          `NPC ${key} quest reference ${questId} must exist in QUESTS or EXPLORATION_QUESTS`
        );
      }
    }
  });

  it('has personality traits in the [0, 1] range when present', () => {
    for (const [key, npc] of Object.entries(NPCS)) {
      if (!npc.personality) continue;
      for (const [trait, value] of Object.entries(npc.personality)) {
        assert.ok(
          typeof value === 'number' && value >= 0 && value <= 1,
          `NPC ${key} personality trait ${trait} must be between 0 and 1`
        );
      }
    }
  });

  it('has well-formed shop inventories for merchant NPCs', () => {
    for (const [key, npc] of Object.entries(NPCS)) {
      if (npc.type !== 'MERCHANT' || !npc.shopInventory) continue;

      assert.ok(
        typeof npc.shopInventory === 'object' && !Array.isArray(npc.shopInventory),
        `NPC ${key} shopInventory must be an object`
      );

      for (const [category, items] of Object.entries(npc.shopInventory)) {
        assert.ok(isNonEmptyString(category), `NPC ${key} shop category name must be non-empty string`);
        assert.ok(Array.isArray(items), `NPC ${key} shop category ${category} must be an array`);
        for (const itemId of items) {
          assert.ok(isNonEmptyString(itemId), `NPC ${key} shop item id in category ${category} must be non-empty string`);
        }
      }

      if (npc.buyMultiplier !== undefined) {
        assert.ok(
          typeof npc.buyMultiplier === 'number' && npc.buyMultiplier > 0,
          `NPC ${key} buyMultiplier must be a positive number when present`
        );
      }

      if (npc.sellMultiplier !== undefined) {
        assert.ok(
          typeof npc.sellMultiplier === 'number' && npc.sellMultiplier > 0,
          `NPC ${key} sellMultiplier must be a positive number when present`
        );
      }
    }
  });

  it('has companions with basic stats and skills when applicable', () => {
    for (const [key, npc] of Object.entries(NPCS)) {
      if (npc.type !== 'COMPANION') continue;

      assert.ok(npc.stats && typeof npc.stats === 'object', `Companion NPC ${key} must have stats object`);
      assert.ok(Array.isArray(npc.skills), `Companion NPC ${key} must have skills array`);
      assert.ok(npc.skills.length > 0, `Companion NPC ${key} must have at least one skill`);

      const requiredStatKeys = ['level', 'hp', 'mp', 'attack', 'defense', 'speed'];
      for (const statKey of requiredStatKeys) {
        const value = npc.stats[statKey];
        assert.ok(
          typeof value === 'number' && Number.isFinite(value),
          `Companion NPC ${key} stats.${statKey} must be a finite number`
        );
      }
    }
  });

  it('has basic structure for boss NPCs when present', () => {
    for (const [key, npc] of Object.entries(NPCS)) {
      if (npc.type !== 'BOSS') continue;

      assert.ok(npc.stats && typeof npc.stats === 'object', `Boss NPC ${key} must have stats object`);
      assert.ok(
        typeof npc.isBoss === 'boolean' || npc.isBoss === undefined,
        `Boss NPC ${key} isBoss flag, when present, must be boolean`
      );

      if (npc.drops) {
        const { guaranteed, random } = npc.drops;
        if (guaranteed !== undefined) {
          assert.ok(Array.isArray(guaranteed), `Boss NPC ${key} guaranteed drops must be an array when present`);
          for (const itemId of guaranteed) {
            assert.ok(isNonEmptyString(itemId), `Boss NPC ${key} guaranteed drop id must be non-empty string`);
          }
        }
        if (random !== undefined) {
          assert.ok(Array.isArray(random), `Boss NPC ${key} random drops must be an array when present`);
          for (const drop of random) {
            assert.ok(drop && typeof drop === 'object', `Boss NPC ${key} random drop entry must be an object`);
            assert.ok(isNonEmptyString(drop.item), `Boss NPC ${key} random drop item id must be non-empty string`);
            if (drop.chance !== undefined) {
              assert.ok(
                typeof drop.chance === 'number' && drop.chance >= 0 && drop.chance <= 1,
                `Boss NPC ${key} random drop chance must be between 0 and 1`
              );
            }
          }
        }
      }
    }
  });
});
