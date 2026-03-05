/**
 * Character class definitions.
 * @type {Record<string, {id:string,name:string,description:string,baseStats:{hp:number,maxHp:number,mp:number,maxMp:number,atk:number,def:number,spd:number,int:number,lck:number},abilities:string[]}>}
 */
export const CLASS_DEFINITIONS = {
  warrior: {
    id: "warrior",
    name: "Warrior",
    description: "Frontline fighter with high durability and physical power.",
    baseStats: {
      hp: 50,
      maxHp: 50,
      mp: 15,
      maxMp: 15,
      atk: 12,
      def: 10,
      spd: 6,
      int: 3,
      lck: 5,
    },
    abilities: ["power-strike", "shield-bash", "war-cry"],
  },
  mage: {
    id: "mage",
    name: "Mage",
    description: "Arcane specialist with strong magic and area control.",
    baseStats: {
      hp: 28,
      maxHp: 28,
      mp: 50,
      maxMp: 50,
      atk: 6,
      def: 4,
      spd: 5,
      int: 14,
      lck: 6,
    },
    abilities: ["fireball", "blizzard", "thunder-bolt", "arcane-shield"],
  },
  rogue: {
    id: "rogue",
    name: "Rogue",
    description: "Agile skirmisher focused on speed, precision, and tricks.",
    baseStats: {
      hp: 36,
      maxHp: 36,
      mp: 20,
      maxMp: 20,
      atk: 10,
      def: 6,
      spd: 12,
      int: 7,
      lck: 10,
    },
    abilities: ["backstab", "poison-blade", "smoke-bomb"],
  },
  cleric: {
    id: "cleric",
    name: "Cleric",
    description: "Support healer with balanced defenses and holy magic.",
    baseStats: {
      hp: 40,
      maxHp: 40,
      mp: 40,
      maxMp: 40,
      atk: 7,
      def: 8,
      spd: 5,
      int: 10,
      lck: 7,
    },
    abilities: ["heal", "group-heal", "smite", "purify"],
  },
};

/**
 * Get a class definition by id.
 * @param {string} classId
 * @returns {object|null}
 */
export function getClassDefinition(classId) {
  return CLASS_DEFINITIONS[classId] || null;
}

/**
 * Return all class definitions.
 * @returns {object[]}
 */
export function getAllClasses() {
  return Object.values(CLASS_DEFINITIONS);
}
