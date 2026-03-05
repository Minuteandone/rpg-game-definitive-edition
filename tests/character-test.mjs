/**
 * Character/Party System Tests — AI Village RPG
 * Run: node tests/character-test.mjs
 */

import { calcLevel, xpToNextLevel, XP_THRESHOLDS, STAT_GROWTH } from '../src/characters/stats.js';
import { getClassDefinition, getAllClasses } from '../src/characters/classes.js';
import { createCharacter, gainXp, isAlive, healCharacter, toCombatant } from '../src/characters/character.js';
import { createParty, addMember, removeMember, setActiveParty, getActiveMembers, getActiveCombatants, applyXpToParty, restoreParty, MAX_PARTY_SIZE } from '../src/characters/party.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log('  PASS: ' + msg);
  } else {
    failed++;
    console.error('  FAIL: ' + msg);
  }
}

console.log('\n--- Stats ---');
assert(calcLevel(0) === 1, 'Level 1 at XP 0');
assert(calcLevel(100) === 2, 'Level 2 at XP 100');
assert(calcLevel(99) === 1, 'Still level 1 at XP 99');
assert(calcLevel(10450) === 20, 'Level 20 at max XP');
assert(calcLevel(99999) === 20, 'Capped at level 20');
assert(xpToNextLevel(0) === 100, 'Need 100 XP for level 2');
assert(xpToNextLevel(10450) === 0, 'No XP needed at max level');

console.log('\n--- Classes ---');
const warrior = getClassDefinition('warrior');
assert(warrior !== null, 'Warrior class exists');
assert(warrior.baseStats.hp === 50, 'Warrior HP is 50');
assert(warrior.abilities.includes('power-strike'), 'Warrior has power-strike');
const mage = getClassDefinition('mage');
assert(mage.baseStats.mp === 50, 'Mage MP is 50');
const allClasses = getAllClasses();
assert(allClasses.length === 4, '4 classes available');
assert(getClassDefinition('unknown') === null, 'Unknown class returns null');

console.log('\n--- Character Creation ---');
const hero = createCharacter({ name: 'Aria', classId: 'warrior', id: 'hero-1' });
assert(hero.id === 'hero-1', 'Custom ID respected');
assert(hero.name === 'Aria', 'Name set correctly');
assert(hero.level === 1, 'Starts at level 1');
assert(hero.xp === 0, 'Starts with 0 XP');
assert(hero.stats.hp === 50, 'Warrior HP is 50');
assert(hero.equipment.weapon === null, 'Starts with no equipment');
const mageChar = createCharacter({ name: 'Zephyr', classId: 'mage' });
assert(mageChar.id.startsWith('char-'), 'Auto-generated ID starts with char-');

console.log('\n--- XP and Leveling ---');
const { character: leveled, levelsGained, messages } = gainXp(hero, 100);
assert(leveled.xp === 100, 'XP is 100');
assert(leveled.level === 2, 'Reached level 2');
assert(levelsGained === 1, '1 level gained');
assert(leveled.stats.maxHp > 50, 'HP increased on level up');
const { character: multiLevel } = gainXp(hero, 1000);
assert(multiLevel.level >= 5, 'Multi-level XP works');

console.log('\n--- isAlive / healCharacter ---');
assert(isAlive(hero), 'Full HP character is alive');
const deadHero = { ...hero, stats: { ...hero.stats, hp: 0 } };
assert(!isAlive(deadHero), 'Zero HP character is dead');
const woundedHero = { ...hero, stats: { ...hero.stats, hp: 10 } };
const healed = healCharacter(woundedHero, 20);
assert(healed.stats.hp === 30, 'Healed to 30 HP');
const overhealed = healCharacter(woundedHero, 999);
assert(overhealed.stats.hp === hero.stats.maxHp, 'Capped at maxHp');

console.log('\n--- toCombatant ---');
const combatant = toCombatant(hero);
assert(combatant.id === hero.id, 'Combatant ID matches');
assert(combatant.hp === hero.stats.hp, 'HP matches');
assert(combatant.atk === hero.stats.atk, 'ATK matches');
assert(combatant.element === null, 'Element is null');
assert(combatant.xpReward === Math.floor(hero.level * 15), 'xpReward formula correct');

console.log('\n--- Party Management ---');
let party = createParty();
assert(party.members.length === 0, 'Party starts empty');

const c1 = createCharacter({ name: 'Aria', classId: 'warrior', id: 'p1' });
const c2 = createCharacter({ name: 'Zephyr', classId: 'mage', id: 'p2' });
const c3 = createCharacter({ name: 'Shadow', classId: 'rogue', id: 'p3' });

let res = addMember(party, c1);
assert(res.success, 'Added c1');
party = res.party;
res = addMember(party, c2);
assert(res.success, 'Added c2');
party = res.party;
res = addMember(party, c1);
assert(!res.success, 'Duplicate add rejected');
res = addMember(party, c3);
party = res.party;

res = setActiveParty(party, ['p1', 'p2']);
assert(res.success, 'Set active party');
party = res.party;
assert(getActiveMembers(party).length === 2, '2 active members');
assert(getActiveCombatants(party).length === 2, '2 combatants');

res = setActiveParty(party, ['p1', 'p2', 'p3', 'p1', 'p2']);
assert(!res.success, 'Rejects > MAX_PARTY_SIZE');

party = removeMember(party, 'p2');
assert(party.members.length === 2, 'Roster down to 2');
assert(!party.activePartyIds.includes('p2'), 'p2 removed from active');

console.log('\n--- XP Distribution ---');
let fp = createParty();
fp = addMember(fp, c1).party;
fp = addMember(fp, c2).party;
fp = setActiveParty(fp, ['p1', 'p2']).party;
const { party: afterXp, results } = applyXpToParty(fp, 200);
assert(results.length === 2, '2 XP results');
const p1after = afterXp.members.find(m => m.id === 'p1');
assert(p1after.xp === 100, 'p1 got 100 XP (split equally)');

console.log('\n--- Restore Party ---');
let dp = createParty();
const dmgChar = { ...c1, stats: { ...c1.stats, hp: 1, mp: 0 } };
dp = addMember(dp, dmgChar).party;
const restored = restoreParty(dp);
const rc = restored.members[0];
assert(rc.stats.hp === rc.stats.maxHp, 'HP restored to max');
assert(rc.stats.mp === rc.stats.maxMp, 'MP restored to max');

console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');

if (failed > 0) process.exit(1);
