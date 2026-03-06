import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRequire } from 'node:module';

import { EXPLORATION_QUESTS } from '../src/data/exploration-quests.js';

const require = createRequire(import.meta.url);
const { QUESTS } = require('../src/data/quests.js');
const { NPCS } = require('../src/data/npcs.js');

const QUEST_TYPES = ['MAIN', 'SIDE', 'DAILY', 'ACHIEVEMENT'];
const OBJECTIVE_TYPES = ['TALK', 'KILL', 'COLLECT', 'DELIVER', 'EXPLORE', 'ESCORT', 'INTERACT', 'CUSTOM'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

describe('QUESTS data integrity', () => {
  it('has quests with well-formed structure', () => {
    const questIds = Object.keys(QUESTS);
    assert.ok(questIds.length > 0, 'QUESTS should contain quests');

    for (const questId of questIds) {
      const quest = QUESTS[questId];
      assert.ok(quest, `Quest ${questId} is defined`);
      assert.strictEqual(quest.id, questId, `Quest id should match key for ${questId}`);
      assert.ok(isNonEmptyString(quest.name), `Quest ${questId} must have a name`);
      assert.ok(isNonEmptyString(quest.description), `Quest ${questId} must have a description`);
      assert.ok(QUEST_TYPES.includes(quest.type), `Quest ${questId} has valid type`);
      assert.ok(Number.isInteger(quest.level) && quest.level >= 1, `Quest ${questId} has valid level`);
      assert.ok(Array.isArray(quest.stages) && quest.stages.length > 0, `Quest ${questId} must have at least one stage`);
      assert.ok(Array.isArray(quest.prerequisites), `Quest ${questId} prerequisites must be an array`);

      // prerequisites reference existing quests within QUESTS
      for (const prereq of quest.prerequisites) {
        assert.ok(
          typeof prereq === 'string' && prereq in QUESTS,
          `Quest ${questId} prerequisite ${prereq} must reference another quest in QUESTS`
        );
      }

      // validate stages
      const stageIds = new Set();
      for (const stage of quest.stages) {
        assert.ok(isNonEmptyString(stage.id), `Quest ${questId} stage must have id`);
        assert.ok(!stageIds.has(stage.id), `Quest ${questId} stage id ${stage.id} must be unique`);
        stageIds.add(stage.id);
        assert.ok(isNonEmptyString(stage.name), `Quest ${questId} stage ${stage.id} must have name`);
        assert.ok(isNonEmptyString(stage.description), `Quest ${questId} stage ${stage.id} must have description`);
        assert.ok(
          Array.isArray(stage.objectives) && stage.objectives.length > 0,
          `Quest ${questId} stage ${stage.id} must have objectives`
        );

        for (const objective of stage.objectives) {
          assert.ok(isNonEmptyString(objective.id), `Objective in quest ${questId}/${stage.id} must have id`);
          assert.ok(
            OBJECTIVE_TYPES.includes(objective.type),
            `Objective ${objective.id} in quest ${questId}/${stage.id} has valid type`
          );
          assert.ok(
            isNonEmptyString(objective.description),
            `Objective ${objective.id} in quest ${questId}/${stage.id} must have description`
          );
          if (objective.required !== undefined) {
            assert.ok(
              typeof objective.required === 'boolean',
              `Objective ${objective.id} in quest ${questId}/${stage.id} required flag must be boolean`
            );
          }

          switch (objective.type) {
            case 'TALK':
              assert.ok(
                isNonEmptyString(objective.npcId),
                `TALK objective ${objective.id} in quest ${questId}/${stage.id} must specify npcId`
              );
              assert.ok(
                NPCS[objective.npcId],
                `TALK objective ${objective.id} in quest ${questId}/${stage.id} references existing NPC ${objective.npcId}`
              );
              break;
            case 'KILL':
              assert.ok(
                isNonEmptyString(objective.enemyType),
                `KILL objective ${objective.id} in quest ${questId}/${stage.id} must specify enemyType`
              );
              assert.ok(
                Number.isInteger(objective.count) && objective.count > 0,
                `KILL objective ${objective.id} in quest ${questId}/${stage.id} must have positive count`
              );
              break;
            case 'COLLECT':
              assert.ok(
                isNonEmptyString(objective.itemId),
                `COLLECT objective ${objective.id} in quest ${questId}/${stage.id} must specify itemId`
              );
              assert.ok(
                Number.isInteger(objective.count) && objective.count > 0,
                `COLLECT objective ${objective.id} in quest ${questId}/${stage.id} must have positive count`
              );
              break;
            case 'DELIVER':
              assert.ok(
                isNonEmptyString(objective.npcId),
                `DELIVER objective ${objective.id} in quest ${questId}/${stage.id} must specify npcId`
              );
              assert.ok(
                NPCS[objective.npcId],
                `DELIVER objective ${objective.id} in quest ${questId}/${stage.id} references existing NPC ${objective.npcId}`
              );
              if (objective.itemIds !== undefined) {
                assert.ok(
                  Array.isArray(objective.itemIds) && objective.itemIds.every(isNonEmptyString),
                  `DELIVER objective ${objective.id} in quest ${questId}/${stage.id} itemIds must be array of strings`
                );
              }
              break;
            case 'EXPLORE':
              assert.ok(
                isNonEmptyString(objective.locationId),
                `EXPLORE objective ${objective.id} in quest ${questId}/${stage.id} must specify locationId`
              );
              break;
            case 'ESCORT':
              assert.ok(
                isNonEmptyString(objective.npcId),
                `ESCORT objective ${objective.id} in quest ${questId}/${stage.id} must specify npcId`
              );
              assert.ok(
                NPCS[objective.npcId],
                `ESCORT objective ${objective.id} in quest ${questId}/${stage.id} references existing NPC ${objective.npcId}`
              );
              assert.ok(
                isNonEmptyString(objective.destinationId),
                `ESCORT objective ${objective.id} in quest ${questId}/${stage.id} must specify destinationId`
              );
              break;
            case 'INTERACT':
              assert.ok(
                isNonEmptyString(objective.interactId),
                `INTERACT objective ${objective.id} in quest ${questId}/${stage.id} must specify interactId`
              );
              break;
            case 'CUSTOM':
              // no additional structural guarantees yet
              break;
            default:
              // Should be unreachable due to OBJECTIVE_TYPES guard
              throw new Error(`Unhandled objective type ${objective.type}`);
          }
        }
      }

      // validate nextStage references within quest
      const validStageIds = new Set(stageIds);
      for (const stage of quest.stages) {
        if (stage.nextStage != null) {
          assert.ok(
            typeof stage.nextStage === 'string' && validStageIds.has(stage.nextStage),
            `Quest ${questId} stage ${stage.id} nextStage must reference another stage id or be null`
          );
        }
      }

      // validate rewards structure
      const rewards = quest.rewards || {};
      if (rewards.gold !== undefined) {
        assert.ok(
          Number.isInteger(rewards.gold) && rewards.gold >= 0,
          `Quest ${questId} rewards.gold must be non-negative integer`
        );
      }
      if (rewards.experience !== undefined) {
        assert.ok(
          Number.isInteger(rewards.experience) && rewards.experience >= 0,
          `Quest ${questId} rewards.experience must be non-negative integer`
        );
      }
      if (rewards.items !== undefined) {
        assert.ok(Array.isArray(rewards.items), `Quest ${questId} rewards.items must be array when present`);
        for (const rewardItem of rewards.items) {
          assert.ok(isNonEmptyString(rewardItem), `Quest ${questId} reward item id must be non-empty string`);
        }
      }
    }
  });
});

describe('EXPLORATION_QUESTS metadata', () => {
  it('uses valid quest types and prerequisite references', () => {
    const explorationIds = Object.keys(EXPLORATION_QUESTS);
    assert.ok(explorationIds.length > 0, 'EXPLORATION_QUESTS should contain quests');

    for (const questId of explorationIds) {
      const quest = EXPLORATION_QUESTS[questId];
      assert.ok(quest, `Exploration quest ${questId} is defined`);
      assert.strictEqual(quest.id, questId, `Exploration quest id should match key for ${questId}`);
      assert.ok(QUEST_TYPES.includes(quest.type), `Exploration quest ${questId} has valid type`);
      assert.ok(Array.isArray(quest.prerequisites), `Exploration quest ${questId} prerequisites must be array`);

      for (const prereq of quest.prerequisites) {
        assert.ok(
          typeof prereq === 'string' && (prereq in EXPLORATION_QUESTS || prereq in QUESTS),
          `Exploration quest ${questId} prerequisite ${prereq} must reference another quest`
        );
      }
    }
  });
});
