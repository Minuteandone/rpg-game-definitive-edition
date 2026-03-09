/**
 * Quest Integration Module
 * Bridges exploration gameplay with the quest system.
 * Tracks active quests, checks objectives, awards rewards.
 */

import { getExplorationQuest, getExplorationQuests, getQuestsForRoom } from './data/exploration-quests.js';

/**
 * Initialize quest tracking state
 * @returns {Object} Initial quest state
 */
function initQuestState() {
  return {
    activeQuests: [],      // Array of quest IDs player has accepted
    completedQuests: [],   // Array of completed quest IDs
    questProgress: {},     // { questId: { stageIndex: number, objectiveProgress: { objId: value } } }
    discoveredRooms: []    // Rooms player has visited (for EXPLORE objectives)
  };
}

/**
 * Accept a quest, adding it to active quests
 * @param {Object} questState - Current quest state
 * @param {string} questId - Quest to accept
 * @returns {Object} { questState, accepted, message }
 */
function acceptQuest(questState, questId) {
  const quest = getExplorationQuest(questId);
  if (!quest) {
    return { questState, accepted: false, message: `Quest "${questId}" not found.` };
  }

  if (questState.activeQuests.includes(questId)) {
    return { questState, accepted: false, message: `Quest "${quest.name}" is already active.` };
  }

  if (questState.completedQuests.includes(questId)) {
    return { questState, accepted: false, message: `Quest "${quest.name}" is already completed.` };
  }

  // Check prerequisites
  for (const prereq of quest.prerequisites || []) {
    if (!questState.completedQuests.includes(prereq)) {
      return { questState, accepted: false, message: `Must complete prerequisite quest first.` };
    }
  }

  const newState = {
    ...questState,
    activeQuests: [...questState.activeQuests, questId],
    questProgress: {
      ...questState.questProgress,
      [questId]: {
        stageIndex: 0,
        objectiveProgress: {}
      }
    }
  };

  return {
    questState: newState,
    accepted: true,
    message: `Quest accepted: ${quest.name}`
  };
}

/**
 * Check and update EXPLORE objectives when player enters a room
 * @param {Object} questState - Current quest state
 * @param {string} roomId - Room the player entered
 * @returns {Object} { questState, messages, completedObjectives, completedStages, completedQuests }
 */
function onRoomEnter(questState, roomId) {
  if (!roomId) {
    return { questState, messages: [], completedObjectives: [], completedStages: [], completedQuests: [] };
  }

  const messages = [];
  const completedObjectives = [];
  const completedStages = [];
  const completedQuests = [];

  // Track room discovery
  let newState = questState;
  if (!questState.discoveredRooms.includes(roomId)) {
    newState = {
      ...newState,
      discoveredRooms: [...newState.discoveredRooms, roomId]
    };
  }

  // Check all active quests for EXPLORE objectives
  for (const questId of newState.activeQuests) {
    const quest = getExplorationQuest(questId);
    if (!quest) continue;

    const progress = newState.questProgress[questId];
    if (!progress) continue;

    const stage = quest.stages[progress.stageIndex];
    if (!stage || !stage.objectives) continue;

    let stageComplete = true;
    let objectiveUpdated = false;

    for (const objective of stage.objectives) {
      if (objective.type === 'EXPLORE' && objective.locationId === roomId) {
        // Check if objective was already complete
        const wasComplete = progress.objectiveProgress[objective.id] === true;
        if (!wasComplete) {
          // Mark objective complete
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                objectiveProgress: {
                  ...newState.questProgress[questId].objectiveProgress,
                  [objective.id]: true
                }
              }
            }
          };
          objectiveUpdated = true;
          completedObjectives.push({ questId, objectiveId: objective.id, description: objective.description });
          messages.push(`✓ ${objective.description}`);
        }
      }

      // Check if this objective is complete (required)
      const objProgress = newState.questProgress[questId].objectiveProgress[objective.id];
      if (objective.required && !objProgress) {
        stageComplete = false;
      }
    }

    // Check if stage is now complete
    if (stageComplete && objectiveUpdated) {
      const nextStageId = stage.nextStage;
      if (nextStageId) {
        // Find next stage index
        const nextStageIndex = quest.stages.findIndex(s => s.id === nextStageId);
        if (nextStageIndex !== -1) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                stageIndex: nextStageIndex,
                objectiveProgress: {}
              }
            }
          };
          completedStages.push({ questId, stageId: stage.id, stageName: stage.name });
          messages.push(`Stage complete: ${stage.name}`);
          messages.push(`New objective: ${quest.stages[nextStageIndex].name}`);
        }
      } else {
        // Quest complete!
        newState = {
          ...newState,
          activeQuests: newState.activeQuests.filter(id => id !== questId),
          completedQuests: [...newState.completedQuests, questId],
          questProgress: {
            ...newState.questProgress,
            [questId]: { ...newState.questProgress[questId], completed: true }
          }
        };
        completedQuests.push({ questId, questName: quest.name, rewards: quest.rewards });
        messages.push(`★ Quest complete: ${quest.name}!`);
        if (quest.rewards) {
          if (quest.rewards.experience) messages.push(`  +${quest.rewards.experience} XP`);
          if (quest.rewards.gold) messages.push(`  +${quest.rewards.gold} Gold`);
          if (quest.rewards.items?.length) messages.push(`  Items: ${quest.rewards.items.join(', ')}`);
        }
      }
    }
  }

  return { questState: newState, messages, completedObjectives, completedStages, completedQuests };
}

/**
 * Update KILL objective progress
 * @param {Object} questState - Current quest state
 * @param {string} enemyType - Type of enemy killed
 * @param {number} count - Number killed (default 1)
 * @returns {Object} { questState, messages, completedObjectives, completedStages, completedQuests }
 */
function onEnemyKill(questState, enemyType, count = 1) {
  if (!enemyType) {
    return { questState, messages: [], completedObjectives: [], completedStages: [], completedQuests: [] };
  }

  const messages = [];
  const completedObjectives = [];
  const completedStages = [];
  const completedQuests = [];
  let newState = questState;

  for (const questId of newState.activeQuests) {
    const quest = getExplorationQuest(questId);
    if (!quest) continue;

    const progress = newState.questProgress[questId];
    if (!progress) continue;

    const stage = quest.stages[progress.stageIndex];
    if (!stage || !stage.objectives) continue;

    let stageComplete = true;
    let objectiveUpdated = false;

    for (const objective of stage.objectives) {
      if (objective.type === 'KILL' && objective.enemyType === enemyType) {
        const currentCount = progress.objectiveProgress[objective.id] || 0;
        const newCount = Math.min(currentCount + count, objective.count);

        if (newCount > currentCount) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                objectiveProgress: {
                  ...newState.questProgress[questId].objectiveProgress,
                  [objective.id]: newCount
                }
              }
            }
          };
          objectiveUpdated = true;

          if (newCount >= objective.count) {
            completedObjectives.push({ questId, objectiveId: objective.id, description: objective.description });
            messages.push(`✓ ${objective.description} (${newCount}/${objective.count})`);
          } else {
            messages.push(`${objective.description}: ${newCount}/${objective.count}`);
          }
        }
      }

      // Check if this objective is complete
      const objProgress = newState.questProgress[questId].objectiveProgress[objective.id];
      if (objective.required) {
        if (objective.type === 'KILL') {
          if ((objProgress || 0) < objective.count) stageComplete = false;
        } else if (!objProgress) {
          stageComplete = false;
        }
      }
    }

    // Handle stage/quest completion (same as onRoomEnter)
    if (stageComplete && objectiveUpdated) {
      const nextStageId = stage.nextStage;
      if (nextStageId) {
        const nextStageIndex = quest.stages.findIndex(s => s.id === nextStageId);
        if (nextStageIndex !== -1) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                stageIndex: nextStageIndex,
                objectiveProgress: {}
              }
            }
          };
          completedStages.push({ questId, stageId: stage.id, stageName: stage.name });
          messages.push(`Stage complete: ${stage.name}`);
          messages.push(`New objective: ${quest.stages[nextStageIndex].name}`);
        }
      } else {
        newState = {
          ...newState,
          activeQuests: newState.activeQuests.filter(id => id !== questId),
          completedQuests: [...newState.completedQuests, questId],
          questProgress: {
            ...newState.questProgress,
            [questId]: { ...newState.questProgress[questId], completed: true }
          }
        };
        completedQuests.push({ questId, questName: quest.name, rewards: quest.rewards });
        messages.push(`★ Quest complete: ${quest.name}!`);
        if (quest.rewards) {
          if (quest.rewards.experience) messages.push(`  +${quest.rewards.experience} XP`);
          if (quest.rewards.gold) messages.push(`  +${quest.rewards.gold} Gold`);
          if (quest.rewards.items?.length) messages.push(`  Items: ${quest.rewards.items.join(', ')}`);
        }
      }
    }
  }

  return { questState: newState, messages, completedObjectives, completedStages, completedQuests };
}

/**
 * Update TALK objective progress when speaking to an NPC
 * @param {Object} questState - Current quest state
 * @param {string} npcId - NPC being spoken to
 * @returns {Object} { questState, messages, completedObjectives, completedStages, completedQuests }
 */
function onNPCTalk(questState, npcId) {
  if (!npcId) {
    return { questState, messages: [], completedObjectives: [], completedStages: [], completedQuests: [] };
  }

  const messages = [];
  const completedObjectives = [];
  const completedStages = [];
  const completedQuests = [];
  let newState = questState;

  for (const questId of newState.activeQuests) {
    const quest = getExplorationQuest(questId);
    if (!quest) continue;

    const progress = newState.questProgress[questId];
    if (!progress) continue;

    const stage = quest.stages[progress.stageIndex];
    if (!stage || !stage.objectives) continue;

    let stageComplete = true;
    let objectiveUpdated = false;

    for (const objective of stage.objectives) {
      if (objective.type === 'TALK' && objective.npcId === npcId) {
        const alreadyComplete = progress.objectiveProgress[objective.id] === true;
        if (!alreadyComplete) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                objectiveProgress: {
                  ...newState.questProgress[questId].objectiveProgress,
                  [objective.id]: true
                }
              }
            }
          };
          objectiveUpdated = true;
          completedObjectives.push({ questId, objectiveId: objective.id, description: objective.description });
          messages.push(`✓ ${objective.description}`);
        }
      }

      const objProgress = newState.questProgress[questId].objectiveProgress[objective.id];
      if (objective.required) {
        if (objective.type === 'KILL') {
          if ((objProgress || 0) < objective.count) stageComplete = false;
        } else if (!objProgress) {
          stageComplete = false;
        }
      }
    }

    if (stageComplete && objectiveUpdated) {
      const nextStageId = stage.nextStage;
      if (nextStageId) {
        const nextStageIndex = quest.stages.findIndex(s => s.id === nextStageId);
        if (nextStageIndex !== -1) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                stageIndex: nextStageIndex,
                objectiveProgress: {}
              }
            }
          };
          completedStages.push({ questId, stageId: stage.id, stageName: stage.name });
          messages.push(`Stage complete: ${stage.name}`);
          messages.push(`New objective: ${quest.stages[nextStageIndex].name}`);
        }
      } else {
        newState = {
          ...newState,
          activeQuests: newState.activeQuests.filter(id => id !== questId),
          completedQuests: [...newState.completedQuests, questId],
          questProgress: {
            ...newState.questProgress,
            [questId]: { ...newState.questProgress[questId], completed: true }
          }
        };
        completedQuests.push({ questId, questName: quest.name, rewards: quest.rewards });
        messages.push(`★ Quest complete: ${quest.name}!`);
        if (quest.rewards) {
          if (quest.rewards.experience) messages.push(`  +${quest.rewards.experience} XP`);
          if (quest.rewards.gold) messages.push(`  +${quest.rewards.gold} Gold`);
          if (quest.rewards.items?.length) messages.push(`  Items: ${quest.rewards.items.join(', ')}`);
        }
      }
    }
  }

  return { questState: newState, messages, completedObjectives, completedStages, completedQuests };
}

/**
 * Get current progress for a quest
 * @param {Object} questState - Current quest state
 * @param {string} questId - Quest ID
 * @returns {Object|null} Progress info or null if not active
 */
function getQuestProgress(questState, questId) {
  const quest = getExplorationQuest(questId);
  if (!quest) return null;

  const isActive = questState.activeQuests.includes(questId);
  const isComplete = questState.completedQuests.includes(questId);
  const progress = questState.questProgress[questId];

  if (!isActive && !isComplete) return null;

  const currentStage = isComplete ? null : quest.stages[progress?.stageIndex || 0];

  return {
    questId,
    questName: quest.name,
    isActive,
    isComplete,
    currentStage: currentStage?.name || null,
    stageIndex: progress?.stageIndex || 0,
    totalStages: quest.stages.length,
    objectiveProgress: progress?.objectiveProgress || {}
  };
}

/**
 * Get available quests that can be started in a room
 * @param {Object} questState - Current quest state
 * @param {string} roomId - Room ID
 * @returns {Array} Array of quest objects available to accept
 */
function getAvailableQuestsInRoom(questState, roomId) {
  const roomQuests = getQuestsForRoom(roomId);
  return roomQuests.filter(quest => {
    // Not already active or completed
    if (questState.activeQuests.includes(quest.id)) return false;
    if (questState.completedQuests.includes(quest.id)) return false;
    // Prerequisites met
    for (const prereq of quest.prerequisites || []) {
      if (!questState.completedQuests.includes(prereq)) return false;
    }
    return true;
  });
}

/**
 * Get summary of all active quests
 * @param {Object} questState - Current quest state
 * @returns {Array} Array of quest progress summaries
 */
function getActiveQuestsSummary(questState) {
  return questState.activeQuests.map(questId => getQuestProgress(questState, questId)).filter(Boolean);
}

/**
 * Apply quest rewards to player state
 * @param {Object} playerState - Player state object
 * @param {Object} rewards - Rewards object { experience, gold, items }
 * @returns {Object} { playerState, messages }
 */
function applyQuestRewards(playerState, rewards) {
  if (!rewards) return { playerState, messages: [] };

  const messages = [];
  let newPlayer = { ...playerState };

  if (rewards.experience && rewards.experience > 0) {
    const oldXp = newPlayer.xp || 0;
    newPlayer = { ...newPlayer, xp: oldXp + rewards.experience };
    messages.push(`Gained ${rewards.experience} experience.`);
  }

  if (rewards.gold && rewards.gold > 0) {
    const oldGold = newPlayer.gold || 0;
    newPlayer = { ...newPlayer, gold: oldGold + rewards.gold };
    messages.push(`Gained ${rewards.gold} gold.`);
  }

  if (rewards.items && rewards.items.length > 0) {
    const inv = { ...(newPlayer.inventory || {}) };
    for (const item of rewards.items) {
      inv[item] = (inv[item] || 0) + 1;
      messages.push(`Received ${item}.`);
    }
    newPlayer = { ...newPlayer, inventory: inv };
  }

  return { playerState: newPlayer, messages };
}

export {
  initQuestState,
  acceptQuest,
  onRoomEnter,
  onEnemyKill,
  onNPCTalk,
  getQuestProgress,
  getAvailableQuestsInRoom,
  getActiveQuestsSummary,
  applyQuestRewards
};
