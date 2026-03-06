/**
 * Equipment Set Bonus definitions and utilities.
 * Each set defines required item IDs and the stat bonuses granted
 * when all pieces are equipped.
 */

/**
 * @typedef {Object} EquipmentSlots
 * @property {string|null} weapon
 * @property {string|null} armor
 * @property {string|null} accessory
 */

/**
 * @typedef {Object} StatBonuses
 * @property {number} [attack]
 * @property {number} [defense]
 * @property {number} [speed]
 * @property {number} [magic]
 * @property {number} [critChance]
 */

/**
 * Equipment set definitions.
 * @type {Array<{ id: string, name: string, flavor: string, requiredItems: string[], bonuses: StatBonuses }>}
 */
export const equipmentSets = [
  {
    id: 'rustySet',
    name: 'Rusty Set',
    flavor: 'Weathered gear that still gets the job done.',
    requiredItems: ['rustySword', 'leatherArmor'],
    bonuses: { attack: 3, defense: 2, speed: 1, magic: 0, critChance: 0 },
  },
  {
    id: 'ironSet',
    name: 'Iron Set',
    flavor: 'Reliable kit favored by fledgling knights.',
    requiredItems: ['ironSword', 'chainmail'],
    bonuses: { attack: 6, defense: 8, speed: 0, magic: 0, critChance: 2 },
  },
  {
    id: 'huntersSet',
    name: "Hunter's Set",
    flavor: 'Built for silent steps and precise strikes.',
    requiredItems: ['huntersBow', 'shadowCloak'],
    bonuses: { attack: 5, defense: 4, speed: 6, magic: 0, critChance: 6 },
  },
  {
    id: 'mageSet',
    name: 'Mage Set',
    flavor: 'Channeling arcane power through careful focus.',
    requiredItems: ['arcaneStaff', 'mageRobe'],
    bonuses: { attack: 0, defense: 4, speed: 0, magic: 12, critChance: 4 },
  },
  {
    id: 'fortuneSet',
    name: 'Fortune Set',
    flavor: 'Luck, vigor, and swiftness intertwine to tip fate.',
    requiredItems: ['ringOfFortune', 'amuletOfVigor', 'bootsOfSwiftness'],
    bonuses: { attack: 0, defense: 4, speed: 8, magic: 0, critChance: 8 },
  },
];

/**
 * Determine which equipment sets are active for the provided equipment.
 * @param {EquipmentSlots|null|undefined} equipment - Equipped item IDs per slot.
 * @returns {string[]} Array of active set IDs.
 */
export function getActiveEquipmentSetIds(equipment) {
  if (!equipment) return [];
  const equippedIds = new Set(Object.values(equipment));
  return equipmentSets
    .filter((set) => set.requiredItems.every((id) => equippedIds.has(id)))
    .map((set) => set.id);
}

/**
 * Calculate total stat bonuses from all completed equipment sets.
 * @param {EquipmentSlots|null|undefined} equipment - Equipped item IDs per slot.
 * @returns {StatBonuses} Combined bonuses from active sets.
 */
export function getEquipmentSetBonuses(equipment) {
  const bonuses = { attack: 0, defense: 0, speed: 0, magic: 0, critChance: 0 };
  if (!equipment) return bonuses;
  const equippedIds = new Set(Object.values(equipment));

  for (const set of equipmentSets) {
    const isActive = set.requiredItems.every((id) => equippedIds.has(id));
    if (!isActive) continue;
    for (const [stat, value] of Object.entries(set.bonuses)) {
      if (typeof value === 'number') {
        bonuses[stat] = (bonuses[stat] || 0) + value;
      }
    }
  }

  return bonuses;
}
