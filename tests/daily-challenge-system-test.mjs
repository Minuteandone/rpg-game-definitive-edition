/**
 * Daily Challenge System Tests
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';

import {
  CHALLENGE_TYPE,
  CHALLENGE_DIFFICULTY,
  CHALLENGE_TEMPLATES,
  REWARD_MULTIPLIERS,
  BASE_REWARDS,
  STREAK_BONUSES,
  createDailyChallengeState,
  generateDailyChallenges,
  createChallenge,
  initializeDailyChallenges,
  updateChallengeProgress,
  claimChallengeReward,
  getStreakBonus,
  getChallenge,
  getAllChallenges,
  getActiveChallenges,
  getCompletedChallenges,
  getClaimableChallenges,
  getChallengeProgress,
  getChallengesByType,
  getChallengesByDifficulty,
  getDailyCompletionCount,
  getTotalChallenges,
  getDailyCompletionPercentage,
  areAllChallengesComplete,
  getTimeUntilReset,
  getAllChallengeTypes,
  getAllDifficulties,
  getChallengeTemplate,
  getAllChallengeTemplates,
  getTemplatesByType,
} from '../src/daily-challenge-system.js';

import {
  getDailyChallengeStyles,
  renderDailyChallengePanel,
  renderStreakDisplay,
  renderCompletionSummary,
  renderChallengeCard,
  renderChallengeNotification,
  renderChallengeHud,
  renderDailyStats,
  renderAllCompleteMessage,
} from '../src/daily-challenge-system-ui.js';

// Banned words that should never appear in game content
const BANNED_WORDS = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

describe('Challenge Constants', () => {
  test('CHALLENGE_TYPE has all expected types', () => {
    assert.strictEqual(CHALLENGE_TYPE.COMBAT, 'combat');
    assert.strictEqual(CHALLENGE_TYPE.EXPLORATION, 'exploration');
    assert.strictEqual(CHALLENGE_TYPE.COLLECTION, 'collection');
    assert.strictEqual(CHALLENGE_TYPE.SOCIAL, 'social');
    assert.strictEqual(CHALLENGE_TYPE.MIXED, 'mixed');
  });

  test('CHALLENGE_DIFFICULTY has all expected levels', () => {
    assert.strictEqual(CHALLENGE_DIFFICULTY.EASY, 'easy');
    assert.strictEqual(CHALLENGE_DIFFICULTY.MEDIUM, 'medium');
    assert.strictEqual(CHALLENGE_DIFFICULTY.HARD, 'hard');
    assert.strictEqual(CHALLENGE_DIFFICULTY.EXPERT, 'expert');
  });

  test('REWARD_MULTIPLIERS has correct values', () => {
    assert.strictEqual(REWARD_MULTIPLIERS.easy, 1.0);
    assert.strictEqual(REWARD_MULTIPLIERS.medium, 1.5);
    assert.strictEqual(REWARD_MULTIPLIERS.hard, 2.0);
    assert.strictEqual(REWARD_MULTIPLIERS.expert, 3.0);
  });

  test('BASE_REWARDS has xp and gold', () => {
    assert.ok(BASE_REWARDS.xp > 0);
    assert.ok(BASE_REWARDS.gold > 0);
  });

  test('STREAK_BONUSES has increasing values', () => {
    const keys = Object.keys(STREAK_BONUSES).map(Number).sort((a, b) => a - b);
    let prev = 0;
    for (const key of keys) {
      assert.ok(STREAK_BONUSES[key] > prev);
      prev = STREAK_BONUSES[key];
    }
  });
});

describe('Challenge Templates', () => {
  test('All templates have required fields', () => {
    for (const [id, template] of Object.entries(CHALLENGE_TEMPLATES)) {
      assert.strictEqual(template.id, id, `Template ${id} id mismatch`);
      assert.ok(template.name, `Template ${id} missing name`);
      assert.ok(template.description, `Template ${id} missing description`);
      assert.ok(template.type, `Template ${id} missing type`);
      assert.ok(template.icon, `Template ${id} missing icon`);
      assert.ok(template.targetRanges, `Template ${id} missing targetRanges`);
      assert.ok(template.stat, `Template ${id} missing stat`);
    }
  });

  test('All templates have valid types', () => {
    const validTypes = Object.values(CHALLENGE_TYPE);
    for (const [id, template] of Object.entries(CHALLENGE_TEMPLATES)) {
      assert.ok(
        validTypes.includes(template.type),
        `Template ${id} has invalid type: ${template.type}`
      );
    }
  });

  test('All templates have target ranges for all difficulties', () => {
    const difficulties = Object.values(CHALLENGE_DIFFICULTY);
    for (const [id, template] of Object.entries(CHALLENGE_TEMPLATES)) {
      for (const diff of difficulties) {
        assert.ok(
          template.targetRanges[diff],
          `Template ${id} missing targetRange for ${diff}`
        );
        assert.ok(
          Array.isArray(template.targetRanges[diff]) && template.targetRanges[diff].length === 2,
          `Template ${id} targetRange for ${diff} must be [min, max]`
        );
      }
    }
  });

  test('Target ranges have min <= max', () => {
    for (const [id, template] of Object.entries(CHALLENGE_TEMPLATES)) {
      for (const [diff, [min, max]] of Object.entries(template.targetRanges)) {
        assert.ok(
          min <= max,
          `Template ${id} ${diff} has min > max: ${min} > ${max}`
        );
      }
    }
  });
});

describe('createDailyChallengeState', () => {
  test('Creates state with empty arrays', () => {
    const state = createDailyChallengeState();
    assert.ok(Array.isArray(state.currentChallenges));
    assert.ok(Array.isArray(state.completedToday));
    assert.ok(Array.isArray(state.history));
    assert.strictEqual(state.currentChallenges.length, 0);
  });

  test('Creates state with zero streak', () => {
    const state = createDailyChallengeState();
    assert.strictEqual(state.streak, 0);
  });

  test('Creates state with null lastCompletedDate', () => {
    const state = createDailyChallengeState();
    assert.strictEqual(state.lastCompletedDate, null);
  });

  test('Creates state with empty dailyProgress', () => {
    const state = createDailyChallengeState();
    assert.ok(typeof state.dailyProgress === 'object');
    assert.strictEqual(Object.keys(state.dailyProgress).length, 0);
  });
});

describe('generateDailyChallenges', () => {
  test('Generates specified number of challenges', () => {
    const challenges = generateDailyChallenges(new Date(), 3);
    assert.strictEqual(challenges.length, 3);
  });

  test('Generates different challenges', () => {
    const challenges = generateDailyChallenges(new Date(), 3);
    const templateIds = challenges.map(c => c.templateId);
    const uniqueIds = new Set(templateIds);
    assert.strictEqual(uniqueIds.size, 3);
  });

  test('Same date generates same challenges', () => {
    const date = new Date('2025-01-15');
    const challenges1 = generateDailyChallenges(date, 3);
    const challenges2 = generateDailyChallenges(date, 3);

    for (let i = 0; i < 3; i++) {
      assert.strictEqual(challenges1[i].templateId, challenges2[i].templateId);
      assert.strictEqual(challenges1[i].target, challenges2[i].target);
    }
  });

  test('Different dates generate different challenges', () => {
    const date1 = new Date('2025-01-15');
    const date2 = new Date('2025-01-16');
    const challenges1 = generateDailyChallenges(date1, 3);
    const challenges2 = generateDailyChallenges(date2, 3);

    // At least one should be different
    const sameCount = challenges1.filter((c, i) =>
      c.templateId === challenges2[i].templateId
    ).length;
    assert.ok(sameCount < 3, 'Different dates should generate different challenges');
  });

  test('All generated challenges have required fields', () => {
    const challenges = generateDailyChallenges(new Date(), 3);
    for (const c of challenges) {
      assert.ok(c.id);
      assert.ok(c.templateId);
      assert.ok(c.name);
      assert.ok(c.description);
      assert.ok(c.type);
      assert.ok(c.icon);
      assert.ok(c.difficulty);
      assert.ok(c.target > 0);
      assert.ok(c.stat);
      assert.ok(c.rewards);
      assert.strictEqual(c.current, 0);
      assert.strictEqual(c.completed, false);
      assert.strictEqual(c.claimed, false);
    }
  });
});

describe('createChallenge', () => {
  test('Creates challenge from template', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY);
    assert.ok(challenge);
    assert.strictEqual(challenge.templateId, 'defeat-enemies');
    assert.strictEqual(challenge.difficulty, CHALLENGE_DIFFICULTY.EASY);
  });

  test('Returns null for invalid template', () => {
    const challenge = createChallenge('invalid-template', CHALLENGE_DIFFICULTY.EASY);
    assert.strictEqual(challenge, null);
  });

  test('Challenge target is within range', () => {
    const template = CHALLENGE_TEMPLATES['defeat-enemies'];
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY);
    const [min, max] = template.targetRanges[CHALLENGE_DIFFICULTY.EASY];
    assert.ok(challenge.target >= min && challenge.target <= max);
  });

  test('Challenge rewards scale with difficulty', () => {
    const easy = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY);
    const hard = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.HARD);
    assert.ok(hard.rewards.xp > easy.rewards.xp);
    assert.ok(hard.rewards.gold > easy.rewards.gold);
  });

  test('Hard difficulty gives bonus item', () => {
    const hard = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.HARD);
    assert.ok(hard.rewards.items);
    assert.ok(hard.rewards.items.length > 0);
  });

  test('Expert difficulty gives rare bonus item', () => {
    const expert = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EXPERT);
    assert.ok(expert.rewards.items);
    assert.ok(expert.rewards.items.some(i => i.includes('rare')));
  });
});

describe('initializeDailyChallenges', () => {
  test('Generates challenges for empty state', () => {
    const state = createDailyChallengeState();
    const newState = initializeDailyChallenges(state);
    assert.ok(newState.currentChallenges.length > 0);
  });

  test('Does not regenerate on same day', () => {
    const state = createDailyChallengeState();
    const newState = initializeDailyChallenges(state);
    const today = new Date().toISOString().split('T')[0];
    newState.lastCompletedDate = today;
    newState.completedToday = ['test'];

    const sameDay = initializeDailyChallenges(newState);
    assert.deepStrictEqual(sameDay.currentChallenges, newState.currentChallenges);
  });

  test('Maintains streak when completing on consecutive days', () => {
    const state = createDailyChallengeState();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    state.lastCompletedDate = yesterday.toISOString().split('T')[0];
    state.completedToday = ['some-challenge'];
    state.streak = 5;

    const newState = initializeDailyChallenges(state);
    assert.strictEqual(newState.streak, 6);
  });
});

describe('updateChallengeProgress', () => {
  test('Updates progress for matching stat', () => {
    let state = createDailyChallengeState();
    state.currentChallenges = [createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1)];

    const result = updateChallengeProgress(state, 'enemiesDefeated', 3);
    assert.strictEqual(result.state.currentChallenges[0].current, 3);
  });

  test('Does not update progress for non-matching stat', () => {
    let state = createDailyChallengeState();
    state.currentChallenges = [createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1)];

    const result = updateChallengeProgress(state, 'goldCollected', 100);
    assert.strictEqual(result.state.currentChallenges[0].current, 0);
  });

  test('Marks challenge complete when target reached', () => {
    let state = createDailyChallengeState();
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    state.currentChallenges = [challenge];

    const result = updateChallengeProgress(state, 'enemiesDefeated', challenge.target);
    assert.strictEqual(result.state.currentChallenges[0].completed, true);
    assert.strictEqual(result.newlyCompleted.length, 1);
  });

  test('Does not exceed target', () => {
    let state = createDailyChallengeState();
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    state.currentChallenges = [challenge];

    const result = updateChallengeProgress(state, 'enemiesDefeated', challenge.target + 100);
    assert.strictEqual(result.state.currentChallenges[0].current, challenge.target);
  });

  test('Tracks daily progress', () => {
    let state = createDailyChallengeState();
    state.currentChallenges = [createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1)];

    const result = updateChallengeProgress(state, 'enemiesDefeated', 5);
    assert.strictEqual(result.state.dailyProgress.enemiesDefeated, 5);
  });
});

describe('claimChallengeReward', () => {
  test('Claims reward for completed challenge', () => {
    let state = createDailyChallengeState();
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.completed = true;
    state.currentChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.ok(result.rewards);
    assert.ok(result.rewards.xp > 0);
    assert.ok(result.rewards.gold > 0);
    assert.strictEqual(result.state.currentChallenges[0].claimed, true);
  });

  test('Returns error for non-existent challenge', () => {
    let state = createDailyChallengeState();
    const result = claimChallengeReward(state, 'non-existent');
    assert.ok(result.error);
    assert.strictEqual(result.rewards, null);
  });

  test('Returns error for incomplete challenge', () => {
    let state = createDailyChallengeState();
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.completed = false;
    state.currentChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.ok(result.error);
    assert.strictEqual(result.rewards, null);
  });

  test('Returns error for already claimed', () => {
    let state = createDailyChallengeState();
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.completed = true;
    challenge.claimed = true;
    state.currentChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.ok(result.error);
    assert.strictEqual(result.rewards, null);
  });

  test('Applies streak bonus to rewards', () => {
    let state = createDailyChallengeState();
    state.streak = 7; // +25% bonus
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.completed = true;
    state.currentChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.ok(result.rewards.xp > challenge.rewards.xp);
    assert.strictEqual(result.rewards.streakBonus, 0.25);
  });

  test('Updates completion tracking', () => {
    let state = createDailyChallengeState();
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.completed = true;
    state.currentChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.ok(result.state.completedToday.includes(challenge.id));
    assert.strictEqual(result.state.totalChallengesCompleted, 1);
    assert.ok(result.state.lastCompletedDate);
  });

  test('Adds to history', () => {
    let state = createDailyChallengeState();
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.completed = true;
    state.currentChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.strictEqual(result.state.history.length, 1);
    assert.strictEqual(result.state.history[0].challengeId, challenge.id);
  });
});

describe('getStreakBonus', () => {
  test('Returns 0 for no streak', () => {
    assert.strictEqual(getStreakBonus(0), 0);
  });

  test('Returns 0 for streak below threshold', () => {
    assert.strictEqual(getStreakBonus(2), 0);
  });

  test('Returns correct bonus at thresholds', () => {
    assert.strictEqual(getStreakBonus(3), 0.1);
    assert.strictEqual(getStreakBonus(7), 0.25);
    assert.strictEqual(getStreakBonus(14), 0.5);
    assert.strictEqual(getStreakBonus(30), 1.0);
  });

  test('Returns highest applicable bonus', () => {
    assert.strictEqual(getStreakBonus(10), 0.25); // 7-day bonus
    assert.strictEqual(getStreakBonus(20), 0.5); // 14-day bonus
    assert.strictEqual(getStreakBonus(100), 1.0); // 30-day bonus
  });
});

describe('Challenge Queries', () => {
  test('getChallenge returns challenge by ID', () => {
    let state = createDailyChallengeState();
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    state.currentChallenges = [challenge];

    const found = getChallenge(state, challenge.id);
    assert.strictEqual(found.id, challenge.id);
  });

  test('getChallenge returns null for unknown ID', () => {
    let state = createDailyChallengeState();
    assert.strictEqual(getChallenge(state, 'unknown'), null);
  });

  test('getAllChallenges returns all challenges', () => {
    let state = createDailyChallengeState();
    state.currentChallenges = [
      createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1),
      createChallenge('collect-gold', CHALLENGE_DIFFICULTY.MEDIUM, 2),
    ];

    const all = getAllChallenges(state);
    assert.strictEqual(all.length, 2);
  });

  test('getActiveChallenges returns incomplete challenges', () => {
    let state = createDailyChallengeState();
    const c1 = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    const c2 = createChallenge('collect-gold', CHALLENGE_DIFFICULTY.MEDIUM, 2);
    c2.completed = true;
    state.currentChallenges = [c1, c2];

    const active = getActiveChallenges(state);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].id, c1.id);
  });

  test('getCompletedChallenges returns completed challenges', () => {
    let state = createDailyChallengeState();
    const c1 = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    const c2 = createChallenge('collect-gold', CHALLENGE_DIFFICULTY.MEDIUM, 2);
    c2.completed = true;
    state.currentChallenges = [c1, c2];

    const completed = getCompletedChallenges(state);
    assert.strictEqual(completed.length, 1);
    assert.strictEqual(completed[0].id, c2.id);
  });

  test('getClaimableChallenges returns completed but unclaimed', () => {
    let state = createDailyChallengeState();
    const c1 = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    c1.completed = true;
    c1.claimed = false;
    const c2 = createChallenge('collect-gold', CHALLENGE_DIFFICULTY.MEDIUM, 2);
    c2.completed = true;
    c2.claimed = true;
    state.currentChallenges = [c1, c2];

    const claimable = getClaimableChallenges(state);
    assert.strictEqual(claimable.length, 1);
    assert.strictEqual(claimable[0].id, c1.id);
  });
});

describe('getChallengeProgress', () => {
  test('Returns 0 for no progress', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    assert.strictEqual(getChallengeProgress(challenge), 0);
  });

  test('Returns correct percentage', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.target = 10;
    challenge.current = 5;
    assert.strictEqual(getChallengeProgress(challenge), 50);
  });

  test('Caps at 100%', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.target = 10;
    challenge.current = 15;
    assert.strictEqual(getChallengeProgress(challenge), 100);
  });

  test('Returns 0 for null challenge', () => {
    assert.strictEqual(getChallengeProgress(null), 0);
  });
});

describe('Filter Functions', () => {
  test('getChallengesByType filters by type', () => {
    let state = createDailyChallengeState();
    state.currentChallenges = [
      createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1),
      createChallenge('collect-gold', CHALLENGE_DIFFICULTY.MEDIUM, 2),
    ];

    const combat = getChallengesByType(state, CHALLENGE_TYPE.COMBAT);
    assert.ok(combat.every(c => c.type === CHALLENGE_TYPE.COMBAT));
  });

  test('getChallengesByDifficulty filters by difficulty', () => {
    let state = createDailyChallengeState();
    state.currentChallenges = [
      createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1),
      createChallenge('collect-gold', CHALLENGE_DIFFICULTY.HARD, 2),
    ];

    const easy = getChallengesByDifficulty(state, CHALLENGE_DIFFICULTY.EASY);
    assert.ok(easy.every(c => c.difficulty === CHALLENGE_DIFFICULTY.EASY));
  });
});

describe('Completion Tracking', () => {
  test('getDailyCompletionCount returns completed today count', () => {
    let state = createDailyChallengeState();
    state.completedToday = ['c1', 'c2'];
    assert.strictEqual(getDailyCompletionCount(state), 2);
  });

  test('getTotalChallenges returns challenge count', () => {
    let state = createDailyChallengeState();
    state.currentChallenges = [
      createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1),
      createChallenge('collect-gold', CHALLENGE_DIFFICULTY.MEDIUM, 2),
    ];
    assert.strictEqual(getTotalChallenges(state), 2);
  });

  test('getDailyCompletionPercentage calculates correctly', () => {
    let state = createDailyChallengeState();
    const c1 = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    const c2 = createChallenge('collect-gold', CHALLENGE_DIFFICULTY.MEDIUM, 2);
    c1.completed = true;
    state.currentChallenges = [c1, c2];

    assert.strictEqual(getDailyCompletionPercentage(state), 50);
  });

  test('areAllChallengesComplete returns true when all complete', () => {
    let state = createDailyChallengeState();
    const c1 = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    c1.completed = true;
    state.currentChallenges = [c1];

    assert.strictEqual(areAllChallengesComplete(state), true);
  });

  test('areAllChallengesComplete returns false when not all complete', () => {
    let state = createDailyChallengeState();
    const c1 = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    state.currentChallenges = [c1];

    assert.strictEqual(areAllChallengesComplete(state), false);
  });
});

describe('getTimeUntilReset', () => {
  test('Returns hours and minutes', () => {
    const time = getTimeUntilReset();
    assert.ok(typeof time.hours === 'number');
    assert.ok(typeof time.minutes === 'number');
    assert.ok(time.hours >= 0 && time.hours <= 23);
    assert.ok(time.minutes >= 0 && time.minutes <= 59);
  });
});

describe('Template Functions', () => {
  test('getAllChallengeTypes returns all types', () => {
    const types = getAllChallengeTypes();
    assert.ok(types.includes(CHALLENGE_TYPE.COMBAT));
    assert.ok(types.includes(CHALLENGE_TYPE.EXPLORATION));
  });

  test('getAllDifficulties returns all difficulties', () => {
    const diffs = getAllDifficulties();
    assert.ok(diffs.includes(CHALLENGE_DIFFICULTY.EASY));
    assert.ok(diffs.includes(CHALLENGE_DIFFICULTY.EXPERT));
  });

  test('getChallengeTemplate returns template by ID', () => {
    const template = getChallengeTemplate('defeat-enemies');
    assert.ok(template);
    assert.strictEqual(template.id, 'defeat-enemies');
  });

  test('getChallengeTemplate returns null for invalid ID', () => {
    const template = getChallengeTemplate('invalid');
    assert.strictEqual(template, null);
  });

  test('getAllChallengeTemplates returns all templates', () => {
    const templates = getAllChallengeTemplates();
    assert.strictEqual(templates.length, Object.keys(CHALLENGE_TEMPLATES).length);
  });

  test('getTemplatesByType filters templates', () => {
    const combat = getTemplatesByType(CHALLENGE_TYPE.COMBAT);
    assert.ok(combat.length > 0);
    assert.ok(combat.every(t => t.type === CHALLENGE_TYPE.COMBAT));
  });
});

// UI Tests
describe('getDailyChallengeStyles', () => {
  test('Returns CSS string', () => {
    const styles = getDailyChallengeStyles();
    assert.ok(typeof styles === 'string');
    assert.ok(styles.includes('.daily-challenge-panel'));
    assert.ok(styles.includes('.challenge-card'));
  });

  test('Includes difficulty colors', () => {
    const styles = getDailyChallengeStyles();
    assert.ok(styles.includes('.challenge-difficulty.easy'));
    assert.ok(styles.includes('.challenge-difficulty.expert'));
  });
});

describe('renderDailyChallengePanel', () => {
  test('Renders panel with header', () => {
    const state = initializeDailyChallenges(createDailyChallengeState());
    const html = renderDailyChallengePanel(state);
    assert.ok(html.includes('daily-challenge-panel'));
    assert.ok(html.includes('Daily Challenges'));
  });

  test('Shows reset timer', () => {
    const state = initializeDailyChallenges(createDailyChallengeState());
    const html = renderDailyChallengePanel(state);
    assert.ok(html.includes('Resets in'));
  });

  test('Renders challenge cards', () => {
    const state = initializeDailyChallenges(createDailyChallengeState());
    const html = renderDailyChallengePanel(state);
    assert.ok(html.includes('challenge-card'));
  });
});

describe('renderStreakDisplay', () => {
  test('Shows no streak message when streak is 0', () => {
    const html = renderStreakDisplay(0, 0);
    assert.ok(html.includes('No Streak'));
  });

  test('Shows streak count', () => {
    const html = renderStreakDisplay(5, 0.1);
    assert.ok(html.includes('5 Day Streak'));
  });

  test('Shows bonus percentage', () => {
    const html = renderStreakDisplay(7, 0.25);
    assert.ok(html.includes('+25%'));
  });
});

describe('renderCompletionSummary', () => {
  test('Shows completion percentage', () => {
    const state = createDailyChallengeState();
    state.currentChallenges = [createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1)];
    const html = renderCompletionSummary(state, 0);
    assert.ok(html.includes('0/1'));
    assert.ok(html.includes('0%'));
  });
});

describe('renderChallengeCard', () => {
  test('Renders challenge info', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    const html = renderChallengeCard(challenge);
    assert.ok(html.includes('challenge-card'));
    assert.ok(html.includes(challenge.name));
  });

  test('Shows progress bar', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    const html = renderChallengeCard(challenge);
    assert.ok(html.includes('challenge-progress-bar'));
  });

  test('Shows claim button when completed', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.completed = true;
    const html = renderChallengeCard(challenge);
    assert.ok(html.includes('claim-button'));
  });

  test('Shows claimed status', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.completed = true;
    challenge.claimed = true;
    const html = renderChallengeCard(challenge);
    assert.ok(html.includes('Claimed'));
  });

  test('Shows streak bonus', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    const html = renderChallengeCard(challenge, 7);
    assert.ok(html.includes('+25%'));
  });
});

describe('renderChallengeNotification', () => {
  test('Shows completion message', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    const html = renderChallengeNotification(challenge);
    assert.ok(html.includes('Challenge Complete'));
  });

  test('Shows challenge name', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    const html = renderChallengeNotification(challenge);
    assert.ok(html.includes(challenge.name));
  });

  test('Shows rewards', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    const html = renderChallengeNotification(challenge);
    assert.ok(html.includes('XP'));
    assert.ok(html.includes('gold'));
  });
});

describe('renderChallengeHud', () => {
  test('Shows active challenges', () => {
    const state = initializeDailyChallenges(createDailyChallengeState());
    const html = renderChallengeHud(state);
    assert.ok(html.includes('challenge-hud'));
  });

  test('Shows all complete message', () => {
    const state = createDailyChallengeState();
    const c = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    c.completed = true;
    c.claimed = true;
    state.currentChallenges = [c];
    const html = renderChallengeHud(state);
    assert.ok(html.includes('All challenges complete'));
  });

  test('Shows claimable notification', () => {
    const state = createDailyChallengeState();
    const c = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    c.completed = true;
    c.claimed = false;
    state.currentChallenges = [c];
    const html = renderChallengeHud(state);
    assert.ok(html.includes('to claim'));
  });
});

describe('renderDailyStats', () => {
  test('Shows completion count', () => {
    const state = initializeDailyChallenges(createDailyChallengeState());
    const html = renderDailyStats(state);
    assert.ok(html.includes('Today:'));
  });

  test('Shows streak count', () => {
    const state = createDailyChallengeState();
    state.streak = 5;
    state.currentChallenges = [];
    const html = renderDailyStats(state);
    assert.ok(html.includes('Streak:'));
    assert.ok(html.includes('5'));
  });
});

describe('renderAllCompleteMessage', () => {
  test('Shows celebration message', () => {
    const state = createDailyChallengeState();
    const html = renderAllCompleteMessage(state);
    assert.ok(html.includes('All Challenges Complete'));
  });

  test('Shows reset timer', () => {
    const state = createDailyChallengeState();
    const html = renderAllCompleteMessage(state);
    assert.ok(html.includes('New challenges in'));
  });

  test('Shows streak info', () => {
    const state = createDailyChallengeState();
    state.streak = 10;
    const html = renderAllCompleteMessage(state);
    assert.ok(html.includes('10 day streak'));
  });
});

// Security Tests
describe('XSS Prevention', () => {
  test('renderChallengeCard escapes challenge name', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.name = '<script>alert("xss")</script>';
    const html = renderChallengeCard(challenge);
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  test('renderChallengeCard escapes description', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.description = '<img onerror="alert(1)">';
    const html = renderChallengeCard(challenge);
    assert.ok(!html.includes('<img'));
    assert.ok(html.includes('&lt;img'));
  });

  test('renderChallengeNotification escapes content', () => {
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.name = '<script>bad</script>';
    challenge.icon = '<img>';
    const html = renderChallengeNotification(challenge);
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('<img>'));
  });
});

describe('Banned Words Security Scan', () => {
  test('No banned words in template names', () => {
    for (const [id, template] of Object.entries(CHALLENGE_TEMPLATES)) {
      const name = template.name.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(
          !name.includes(word),
          `Template ${id} name contains banned word: ${word}`
        );
      }
    }
  });

  test('No banned words in template descriptions', () => {
    for (const [id, template] of Object.entries(CHALLENGE_TEMPLATES)) {
      const desc = template.description.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(
          !desc.includes(word),
          `Template ${id} description contains banned word: ${word}`
        );
      }
    }
  });

  test('No banned words in template IDs', () => {
    for (const id of Object.keys(CHALLENGE_TEMPLATES)) {
      for (const word of BANNED_WORDS) {
        assert.ok(
          !id.toLowerCase().includes(word),
          `Template ID ${id} contains banned word: ${word}`
        );
      }
    }
  });

  test('No banned words in challenge types', () => {
    for (const type of Object.values(CHALLENGE_TYPE)) {
      for (const word of BANNED_WORDS) {
        assert.ok(
          !type.toLowerCase().includes(word),
          `Challenge type ${type} contains banned word: ${word}`
        );
      }
    }
  });

  test('No banned words in difficulty names', () => {
    for (const diff of Object.values(CHALLENGE_DIFFICULTY)) {
      for (const word of BANNED_WORDS) {
        assert.ok(
          !diff.toLowerCase().includes(word),
          `Difficulty ${diff} contains banned word: ${word}`
        );
      }
    }
  });

  test('No banned words in stat names', () => {
    for (const template of Object.values(CHALLENGE_TEMPLATES)) {
      for (const word of BANNED_WORDS) {
        assert.ok(
          !template.stat.toLowerCase().includes(word),
          `Stat ${template.stat} contains banned word: ${word}`
        );
      }
    }
  });
});

describe('Immutability', () => {
  test('updateChallengeProgress does not mutate original state', () => {
    let state = createDailyChallengeState();
    state.currentChallenges = [createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1)];
    const originalCurrent = state.currentChallenges[0].current;

    updateChallengeProgress(state, 'enemiesDefeated', 5);
    assert.strictEqual(state.currentChallenges[0].current, originalCurrent);
  });

  test('claimChallengeReward does not mutate original state', () => {
    let state = createDailyChallengeState();
    const challenge = createChallenge('defeat-enemies', CHALLENGE_DIFFICULTY.EASY, 1);
    challenge.completed = true;
    state.currentChallenges = [challenge];

    claimChallengeReward(state, challenge.id);
    assert.strictEqual(state.currentChallenges[0].claimed, false);
  });

  test('initializeDailyChallenges does not mutate original state', () => {
    let state = createDailyChallengeState();
    const originalLength = state.currentChallenges.length;

    initializeDailyChallenges(state);
    assert.strictEqual(state.currentChallenges.length, originalLength);
  });
});
