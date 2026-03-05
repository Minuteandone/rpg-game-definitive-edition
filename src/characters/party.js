import { gainXp, isAlive, toCombatant } from "./character.js";

/**
 * Maximum number of active party members.
 * @type {number}
 */
export const MAX_PARTY_SIZE = 4;

const MAX_ROSTER_SIZE = 8;

/**
 * Create a new party.
 * @returns {{members: object[], activePartyIds: string[]}}
 */
export function createParty() {
  return { members: [], activePartyIds: [] };
}

/**
 * Add a member to the party roster.
 * @param {{members: object[], activePartyIds: string[]}} party
 * @param {object} character
 * @returns {{party: object, success: boolean, message: string}}
 */
export function addMember(party, character) {
  const exists = party.members.some((member) => member.id === character.id);
  if (exists) {
    return { party, success: false, message: "Character is already in the roster." };
  }
  if (party.members.length >= MAX_ROSTER_SIZE) {
    return { party, success: false, message: "Roster is full." };
  }

  const nextParty = {
    ...party,
    members: [...party.members, character],
  };

  return { party: nextParty, success: true, message: "Character added to roster." };
}

/**
 * Remove a member from the party roster.
 * @param {{members: object[], activePartyIds: string[]}} party
 * @param {string} characterId
 * @returns {{members: object[], activePartyIds: string[]}}
 */
export function removeMember(party, characterId) {
  const nextMembers = party.members.filter((member) => member.id !== characterId);
  const nextActive = party.activePartyIds.filter((id) => id !== characterId);

  return { ...party, members: nextMembers, activePartyIds: nextActive };
}

/**
 * Set the active party lineup.
 * @param {{members: object[], activePartyIds: string[]}} party
 * @param {string[]} characterIds
 * @returns {{party: object, success: boolean, message: string}}
 */
export function setActiveParty(party, characterIds) {
  if (characterIds.length > MAX_PARTY_SIZE) {
    return { party, success: false, message: "Too many active members." };
  }

  const memberIds = new Set(party.members.map((member) => member.id));
  for (const id of characterIds) {
    if (!memberIds.has(id)) {
      return { party, success: false, message: "All active members must exist in the roster." };
    }
  }

  const nextParty = { ...party, activePartyIds: [...characterIds] };
  return { party: nextParty, success: true, message: "Active party updated." };
}

/**
 * Get active party members.
 * @param {{members: object[], activePartyIds: string[]}} party
 * @returns {object[]}
 */
export function getActiveMembers(party) {
  const activeSet = new Set(party.activePartyIds);
  return party.members.filter((member) => activeSet.has(member.id));
}

/**
 * Get combatant objects for alive active members.
 * @param {{members: object[], activePartyIds: string[]}} party
 * @returns {object[]}
 */
export function getActiveCombatants(party) {
  return getActiveMembers(party)
    .filter((member) => isAlive(member))
    .map((member) => toCombatant(member));
}

/**
 * Apply XP to each active member equally.
 * @param {{members: object[], activePartyIds: string[]}} party
 * @param {number} xpAmount
 * @returns {{party: object, results: Array<{character: object, levelsGained: number, messages: string[]}>}}
 */
export function applyXpToParty(party, xpAmount) {
  const activeMembers = getActiveMembers(party);
  if (activeMembers.length === 0) {
    return { party, results: [] };
  }

  const splitXp = Math.floor(Math.max(0, Math.floor(xpAmount)) / activeMembers.length);
  const results = [];

  const nextMembers = party.members.map((member) => {
    if (!party.activePartyIds.includes(member.id)) return member;
    const result = gainXp(member, splitXp);
    results.push(result);
    return result.character;
  });

  return { party: { ...party, members: nextMembers }, results };
}

/**
 * Restore all party members to full HP/MP.
 * @param {{members: object[], activePartyIds: string[]}} party
 * @returns {{members: object[], activePartyIds: string[]}}
 */
export function restoreParty(party) {
  const nextMembers = party.members.map((member) => ({
    ...member,
    stats: {
      ...member.stats,
      hp: member.stats.maxHp,
      mp: member.stats.maxMp,
    },
  }));

  return { ...party, members: nextMembers };
}
