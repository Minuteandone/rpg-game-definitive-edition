/**
 * Tests for new side quests: The Missing Merchant, The Lost Cartographer, The Ancient Tome
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { QUESTS } = require('../src/data/quests.js');
const { NPCS } = require('../src/data/npcs.js');

function checkNoEasterEggs(quest) {
  const questJson = JSON.stringify(quest).toLowerCase();
  // Use word boundaries for egg/easter to avoid matching "eastern", etc.
  assert.ok(!/\begg\b/.test(questJson), 'Quest should not contain word: egg');
  assert.ok(!/\beaster\b/.test(questJson), 'Quest should not contain word: easter');
  const forbiddenSubstrings = ['yolk', 'omelet', 'rabbit', 'cockatrice', 'basilisk'];
  for (const word of forbiddenSubstrings) {
    assert.ok(!questJson.includes(word), `Quest should not contain: ${word}`);
  }
}

describe('New Side Quests', () => {
  describe('side_missing_merchant', () => {
    const quest = QUESTS['side_missing_merchant'];

    it('exists in QUESTS', () => {
      assert.ok(quest, 'side_missing_merchant quest should exist');
    });

    it('has correct metadata', () => {
      assert.strictEqual(quest.id, 'side_missing_merchant');
      assert.strictEqual(quest.name, 'The Missing Merchant');
      assert.strictEqual(quest.type, 'SIDE');
      assert.strictEqual(quest.level, 2);
      assert.ok(quest.description.length > 0);
    });

    it('has 4 stages', () => {
      assert.strictEqual(quest.stages.length, 4);
    });

    it('first stage has TALK objective to valid NPC', () => {
      const firstStage = quest.stages[0];
      assert.strictEqual(firstStage.id, 'talk_innkeeper');
      const obj = firstStage.objectives[0];
      assert.strictEqual(obj.type, 'TALK');
      assert.ok(NPCS[obj.npcId], `NPC ${obj.npcId} should exist`);
    });

    it('has a KILL wolves stage', () => {
      const killStage = quest.stages.find(s => s.id === 'defeat_wolves');
      assert.ok(killStage, 'defeat_wolves stage should exist');
      const killObj = killStage.objectives.find(o => o.type === 'KILL');
      assert.ok(killObj, 'should have KILL objective');
      assert.strictEqual(killObj.enemyType, 'wolf');
      assert.strictEqual(killObj.count, 2);
    });

    it('last stage has nextStage null', () => {
      const lastStage = quest.stages[quest.stages.length - 1];
      assert.strictEqual(lastStage.nextStage, null);
    });

    it('has valid rewards', () => {
      assert.strictEqual(quest.rewards.gold, 50);
      assert.strictEqual(quest.rewards.experience, 75);
      assert.ok(Array.isArray(quest.rewards.items));
    });

    it('has no prerequisites', () => {
      assert.deepStrictEqual(quest.prerequisites, []);
    });

    it('contains no forbidden Easter egg motifs', () => {
      checkNoEasterEggs(quest);
    });
  });

  describe('side_lost_cartographer', () => {
    const quest = QUESTS['side_lost_cartographer'];

    it('exists in QUESTS', () => {
      assert.ok(quest, 'side_lost_cartographer quest should exist');
    });

    it('has correct metadata', () => {
      assert.strictEqual(quest.id, 'side_lost_cartographer');
      assert.strictEqual(quest.name, 'The Lost Cartographer');
      assert.strictEqual(quest.type, 'SIDE');
      assert.strictEqual(quest.level, 1);
    });

    it('has 3 stages', () => {
      assert.strictEqual(quest.stages.length, 3);
    });

    it('search stage has 3 EXPLORE objectives', () => {
      const searchStage = quest.stages.find(s => s.id === 'search_zones');
      assert.ok(searchStage, 'search_zones stage should exist');
      const exploreObjs = searchStage.objectives.filter(o => o.type === 'EXPLORE');
      assert.strictEqual(exploreObjs.length, 3, 'should have 3 EXPLORE objectives');
    });

    it('rewards include an ether item', () => {
      assert.ok(quest.rewards.items.includes('ether'), 'rewards should include ether');
      assert.strictEqual(quest.rewards.gold, 30);
      assert.strictEqual(quest.rewards.experience, 50);
    });

    it('all TALK objectives reference valid NPCs', () => {
      for (const stage of quest.stages) {
        for (const obj of stage.objectives) {
          if (obj.type === 'TALK') {
            assert.ok(NPCS[obj.npcId], `NPC ${obj.npcId} should exist`);
          }
        }
      }
    });

    it('contains no forbidden Easter egg motifs', () => {
      checkNoEasterEggs(quest);
    });
  });

  describe('side_ancient_tome', () => {
    const quest = QUESTS['side_ancient_tome'];

    it('exists in QUESTS', () => {
      assert.ok(quest, 'side_ancient_tome quest should exist');
    });

    it('has correct metadata', () => {
      assert.strictEqual(quest.id, 'side_ancient_tome');
      assert.strictEqual(quest.name, 'The Ancient Tome');
      assert.strictEqual(quest.type, 'SIDE');
      assert.strictEqual(quest.level, 3);
    });

    it('has 4 stages', () => {
      assert.strictEqual(quest.stages.length, 4);
    });

    it('has a KILL dark-cultist stage', () => {
      const killStage = quest.stages.find(s => s.id === 'defeat_cultist');
      assert.ok(killStage, 'defeat_cultist stage should exist');
      const killObj = killStage.objectives.find(o => o.type === 'KILL');
      assert.ok(killObj, 'should have KILL objective');
      assert.strictEqual(killObj.enemyType, 'dark-cultist');
      assert.strictEqual(killObj.count, 1);
    });

    it('has rewards with high gold and experience', () => {
      assert.strictEqual(quest.rewards.gold, 100);
      assert.strictEqual(quest.rewards.experience, 150);
      assert.ok(quest.rewards.items.includes('hiPotion'), 'rewards should include hiPotion');
      assert.ok(quest.rewards.items.includes('ether'), 'rewards should include ether');
    });

    it('has main_quest_1 as prerequisite', () => {
      assert.ok(quest.prerequisites.includes('main_quest_1'));
    });

    it('all TALK objectives reference valid NPCs', () => {
      for (const stage of quest.stages) {
        for (const obj of stage.objectives) {
          if (obj.type === 'TALK') {
            assert.ok(NPCS[obj.npcId], `NPC ${obj.npcId} should exist`);
          }
        }
      }
    });

    it('last stage has nextStage null', () => {
      const lastStage = quest.stages[quest.stages.length - 1];
      assert.strictEqual(lastStage.nextStage, null);
    });

    it('contains no forbidden Easter egg motifs', () => {
      checkNoEasterEggs(quest);
    });
  });
});
