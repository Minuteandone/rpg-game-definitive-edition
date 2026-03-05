/**
 * Base stats shared by all characters.
 * @type {{hp:number,maxHp:number,mp:number,maxMp:number,atk:number,def:number,spd:number,int:number,lck:number}}
 */
export const BASE_STATS = {
  hp: 0,
  maxHp: 0,
  mp: 0,
  maxMp: 0,
  atk: 0,
  def: 0,
  spd: 0,
  int: 0,
  lck: 0,
};

/**
 * XP thresholds for levels 1-20.
 * @type {number[]}
 */
export const XP_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
  3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450,
];

/**
 * Per-level stat growth by class.
 * @type {Record<string, {hp:number,mp:number,atk:number,def:number,spd:number,int:number,lck:number}>}
 */
export const STAT_GROWTH = {
  warrior: { hp: 10, mp: 2, atk: 3, def: 3, spd: 1, int: 0, lck: 1 },
  mage: { hp: 4, mp: 8, atk: 1, def: 1, spd: 1, int: 4, lck: 1 },
  rogue: { hp: 6, mp: 3, atk: 2, def: 1, spd: 3, int: 1, lck: 2 },
  cleric: { hp: 7, mp: 6, atk: 2, def: 2, spd: 1, int: 2, lck: 1 },
};

/**
 * Calculate a level (1-20) based on total XP.
 * @param {number} xp
 * @returns {number}
 */
export function calcLevel(xp) {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;

  for (let i = 0; i < XP_THRESHOLDS.length; i += 1) {
    if (safeXp >= XP_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  return Math.min(level, XP_THRESHOLDS.length);
}

/**
 * Return XP needed to reach the next level.
 * @param {number} xp
 * @returns {number}
 */
export function xpToNextLevel(xp) {
  const level = calcLevel(xp);
  if (level >= XP_THRESHOLDS.length) return 0;
  const nextThreshold = XP_THRESHOLDS[level];
  return Math.max(0, nextThreshold - Math.max(0, Math.floor(xp)));
}

/**
 * Apply a single level-up to a character.
 * @param {object} character
 * @returns {object}
 */
export function applyLevelUp(character) {
  const growth = STAT_GROWTH[character.classId];
  if (!growth) {
    throw new Error(`Unknown classId for growth: ${character.classId}`);
  }

  return {
    ...character,
    level: Math.min(character.level + 1, XP_THRESHOLDS.length),
    stats: {
      ...character.stats,
      maxHp: character.stats.maxHp + growth.hp,
      maxMp: character.stats.maxMp + growth.mp,
      hp: character.stats.hp + growth.hp,
      mp: character.stats.mp + growth.mp,
      atk: character.stats.atk + growth.atk,
      def: character.stats.def + growth.def,
      spd: character.stats.spd + growth.spd,
      int: character.stats.int + growth.int,
      lck: character.stats.lck + growth.lck,
    },
  };
}
