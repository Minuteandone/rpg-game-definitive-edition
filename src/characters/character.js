import { getClassDefinition } from "./classes.js";
import { applyLevelUp, calcLevel } from "./stats.js";

/**
 * Create a new character.
 * @param {{name:string,classId:string,id?:string}} params
 * @returns {object}
 */
export function createCharacter({ name, classId, id }) {
  const classDef = getClassDefinition(classId);
  if (!classDef) {
    throw new Error(`Unknown classId: ${classId}`);
  }

  return {
    id: id || `char-${Date.now()}`,
    name,
    classId,
    level: 1,
    xp: 0,
    stats: { ...classDef.baseStats },
    abilities: [...classDef.abilities],
    equipment: { weapon: null, armor: null, accessory: null },
    statusEffects: [],
  };
}

/**
 * Add XP to a character and apply level-ups as needed.
 * @param {object} character
 * @param {number} amount
 * @returns {{character: object, levelsGained: number, messages: string[]}}
 */
export function gainXp(character, amount) {
  const add = Math.max(0, Math.floor(amount));
  let current = { ...character, xp: character.xp + add };
  const targetLevel = calcLevel(current.xp);
  let levelsGained = 0;
  const messages = [];

  while (current.level < targetLevel) {
    current = applyLevelUp(current);
    levelsGained += 1;
    messages.push(`${current.name} reached level ${current.level}.`);
  }

  return { character: current, levelsGained, messages };
}

/**
 * Check if a character is alive.
 * @param {object} character
 * @returns {boolean}
 */
export function isAlive(character) {
  return character.stats.hp > 0;
}

/**
 * Heal a character for the given amount.
 * @param {object} character
 * @param {number} amount
 * @returns {object}
 */
export function healCharacter(character, amount) {
  const heal = Math.max(0, Math.floor(amount));
  return {
    ...character,
    stats: {
      ...character.stats,
      hp: Math.min(character.stats.hp + heal, character.stats.maxHp),
    },
  };
}

/**
 * Convert a character to a combatant format.
 * @param {object} character
 * @returns {object}
 */
export function toCombatant(character) {
  return {
    id: character.id,
    name: character.name,
    hp: character.stats.hp,
    maxHp: character.stats.maxHp,
    mp: character.stats.mp,
    maxMp: character.stats.maxMp,
    atk: character.stats.atk,
    def: character.stats.def,
    spd: character.stats.spd,
    abilities: [...character.abilities],
    element: null,
    xpReward: Math.floor(character.level * 15),
  };
}
