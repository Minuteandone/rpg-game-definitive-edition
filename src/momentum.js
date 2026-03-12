/**
 * Momentum/Overdrive Gauge System
 * Rewards varied combat strategies and builds toward powerful special moves
 */

/**
 * Maximum momentum value
 */
export const MAX_MOMENTUM = 100;

/**
 * Momentum gain sources and their base values
 */
export const MOMENTUM_SOURCES = {
  BASIC_ATTACK: 5,
  SKILL_USE: 8,
  WEAKNESS_HIT: 12,
  SHIELD_BREAK: 15,
  CRITICAL_HIT: 10,
  VARIETY_BONUS: 5, // Bonus for using different action types
  DEFENDING: 3,
  ITEM_USE: 2,
};

/**
 * Action types for variety tracking
 */
export const ACTION_TYPES = {
  ATTACK: 'attack',
  SKILL: 'skill',
  DEFEND: 'defend',
  ITEM: 'item',
  SPECIAL: 'special',
};

/**
 * Overdrive abilities by class
 */
export const OVERDRIVE_ABILITIES = {
  warrior: {
    id: 'warriors-fury',
    name: "Warrior's Fury",
    description: 'Unleash a devastating 3-hit combo dealing massive physical damage.',
    type: 'physical',
    hits: 3,
    powerPerHit: 45,
    effect: { type: 'atk-up', duration: 2, power: 5 },
  },
  mage: {
    id: 'arcane-storm',
    name: 'Arcane Storm',
    description: 'Channel raw magical energy into a devastating spell hitting all elements.',
    type: 'magical',
    hits: 1,
    powerPerHit: 120,
    effect: { type: 'def-down', duration: 3, power: 4 },
  },
  ranger: {
    id: 'arrow-rain',
    name: 'Arrow Rain',
    description: 'Rain down a barrage of arrows with high critical chance.',
    type: 'physical',
    hits: 5,
    powerPerHit: 25,
    critBonus: 0.3, // +30% crit chance
  },
  healer: {
    id: 'divine-blessing',
    name: 'Divine Blessing',
    description: 'Fully restore HP and cure all status effects.',
    type: 'heal',
    healPercent: 1.0, // 100% HP restore
    cleansesStatus: true,
    effect: { type: 'regen', duration: 3, power: 15 },
  },
  default: {
    id: 'limit-break',
    name: 'Limit Break',
    description: 'A powerful attack that transcends normal limits.',
    type: 'physical',
    hits: 2,
    powerPerHit: 50,
  },
};

/**
 * Create initial momentum state for a combatant
 * @returns {Object} Momentum state
 */
export function createMomentumState() {
  return {
    current: 0,
    max: MAX_MOMENTUM,
    lastActions: [], // Track last N actions for variety bonus
    overdriveReady: false,
    turnsUntilDecay: 3, // Momentum starts decaying after 3 turns of inaction
  };
}

/**
 * Calculate momentum gain for an action
 * @param {string} actionType - Type of action performed
 * @param {Object} context - Additional context { hitWeakness, criticalHit, brokeShield }
 * @param {Object} momentumState - Current momentum state
 * @returns {number} Momentum gained
 */
export function calculateMomentumGain(actionType, context = {}, momentumState = null) {
  let gain = 0;

  // Base gain from action type
  switch (actionType) {
    case ACTION_TYPES.ATTACK:
      gain = MOMENTUM_SOURCES.BASIC_ATTACK;
      break;
    case ACTION_TYPES.SKILL:
      gain = MOMENTUM_SOURCES.SKILL_USE;
      break;
    case ACTION_TYPES.DEFEND:
      gain = MOMENTUM_SOURCES.DEFENDING;
      break;
    case ACTION_TYPES.ITEM:
      gain = MOMENTUM_SOURCES.ITEM_USE;
      break;
    default:
      gain = MOMENTUM_SOURCES.BASIC_ATTACK;
  }

  // Bonus for hitting weakness
  if (context.hitWeakness) {
    gain += MOMENTUM_SOURCES.WEAKNESS_HIT;
  }

  // Bonus for critical hit
  if (context.criticalHit) {
    gain += MOMENTUM_SOURCES.CRITICAL_HIT;
  }

  // Bonus for breaking shield
  if (context.brokeShield) {
    gain += MOMENTUM_SOURCES.SHIELD_BREAK;
  }

  // Variety bonus - reward using different action types
  if (momentumState && momentumState.lastActions.length > 0) {
    const lastAction = momentumState.lastActions[momentumState.lastActions.length - 1];
    if (lastAction !== actionType) {
      gain += MOMENTUM_SOURCES.VARIETY_BONUS;
    }
  }

  return gain;
}

/**
 * Add momentum to state
 * @param {Object} state - Momentum state
 * @param {number} amount - Amount to add
 * @param {string} actionType - Action that generated momentum
 * @returns {Object} Updated momentum state
 */
export function addMomentum(state, amount, actionType) {
  const newCurrent = Math.min(state.max, state.current + amount);
  const overdriveReady = newCurrent >= state.max;

  // Track last 5 actions for variety calculation
  const lastActions = [...state.lastActions, actionType].slice(-5);

  return {
    ...state,
    current: newCurrent,
    lastActions,
    overdriveReady,
    turnsUntilDecay: 3, // Reset decay timer
  };
}

/**
 * Consume momentum for overdrive
 * @param {Object} state - Momentum state
 * @returns {Object} Updated momentum state with zero momentum
 */
export function consumeOverdrive(state) {
  if (!state.overdriveReady) {
    return state;
  }

  return {
    ...state,
    current: 0,
    overdriveReady: false,
    lastActions: [],
  };
}

/**
 * Apply turn decay to momentum
 * @param {Object} state - Momentum state
 * @param {boolean} tookAction - Whether the combatant took an action this turn
 * @returns {Object} Updated momentum state
 */
export function applyMomentumDecay(state, tookAction) {
  if (tookAction) {
    return { ...state, turnsUntilDecay: 3 };
  }

  const turnsUntilDecay = Math.max(0, state.turnsUntilDecay - 1);

  if (turnsUntilDecay === 0 && state.current > 0) {
    // Decay 10% of current momentum per turn of inaction
    const decayAmount = Math.ceil(state.current * 0.1);
    const newCurrent = Math.max(0, state.current - decayAmount);
    return {
      ...state,
      current: newCurrent,
      turnsUntilDecay: 0,
      overdriveReady: newCurrent >= state.max,
    };
  }

  return { ...state, turnsUntilDecay };
}

/**
 * Get overdrive ability for a character class
 * @param {string} characterClass - Character's class
 * @returns {Object} Overdrive ability data
 */
export function getOverdriveAbility(characterClass) {
  const classKey = (characterClass || 'default').toLowerCase();
  return OVERDRIVE_ABILITIES[classKey] || OVERDRIVE_ABILITIES.default;
}

/**
 * Calculate overdrive damage
 * @param {Object} ability - Overdrive ability
 * @param {Object} attacker - Attacker stats { atk, level }
 * @param {Object} defender - Defender stats { def }
 * @returns {Object} Damage result { totalDamage, hits, damagePerHit }
 */
export function calculateOverdriveDamage(ability, attacker, defender) {
  if (!ability || ability.type === 'heal') {
    return { totalDamage: 0, hits: 0, damagePerHit: 0 };
  }

  const attackerAtk = attacker.atk || 10;
  const attackerLevel = attacker.level || 1;
  const defenderDef = defender.def || 0;

  const hits = ability.hits || 1;
  const power = ability.powerPerHit || 50;

  // Base damage per hit: (atk * power / 50) * (1 + level/20) - def/3
  const baseDamagePerHit = Math.floor(
    (attackerAtk * power / 50) * (1 + attackerLevel / 20) - defenderDef / 3
  );

  const damagePerHit = Math.max(1, baseDamagePerHit);
  const totalDamage = damagePerHit * hits;

  return { totalDamage, hits, damagePerHit };
}

/**
 * Calculate overdrive healing
 * @param {Object} ability - Overdrive ability
 * @param {Object} target - Target stats { hp, maxHp }
 * @returns {Object} Heal result { healAmount, cleansesStatus }
 */
export function calculateOverdriveHealing(ability, target) {
  if (!ability || ability.type !== 'heal') {
    return { healAmount: 0, cleansesStatus: false };
  }

  const maxHp = target.maxHp || target.hp || 100;
  const healPercent = ability.healPercent || 0.5;

  const healAmount = Math.floor(maxHp * healPercent);
  const cleansesStatus = ability.cleansesStatus || false;

  return { healAmount, cleansesStatus };
}

/**
 * Get momentum percentage for display
 * @param {Object} state - Momentum state
 * @returns {number} Percentage 0-100
 */
export function getMomentumPercent(state) {
  if (!state || state.max === 0) return 0;
  return Math.round((state.current / state.max) * 100);
}

/**
 * Get momentum level for styling (empty, low, medium, high, full)
 * @param {Object} state - Momentum state
 * @returns {string} Level string
 */
export function getMomentumLevel(state) {
  const percent = getMomentumPercent(state);
  if (percent >= 100) return 'full';
  if (percent >= 75) return 'high';
  if (percent >= 50) return 'medium';
  if (percent >= 25) return 'low';
  return 'empty';
}

/**
 * Check if overdrive can be used
 * @param {Object} state - Momentum state
 * @returns {boolean} Whether overdrive is ready
 */
export function canUseOverdrive(state) {
  return !!(state && state.overdriveReady === true);
}

/**
 * Get action variety score (how varied recent actions were)
 * @param {Object} state - Momentum state
 * @returns {number} Variety score 0-1
 */
export function getActionVariety(state) {
  if (!state || !state.lastActions || state.lastActions.length === 0) {
    return 0;
  }

  const uniqueActions = new Set(state.lastActions);
  return uniqueActions.size / Math.min(state.lastActions.length, 4);
}
