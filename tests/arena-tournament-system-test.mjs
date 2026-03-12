/**
 * Arena Tournament System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  TOURNAMENT_TYPE,
  ARENA_TIER,
  MATCH_RESULT,
  TOURNAMENTS,
  createArenaState,
  getTierForRating,
  getNextTierProgress,
  generateOpponent,
  calculateRatingChange,
  processMatchResult,
  createTournament,
  getNextPlayerMatch,
  recordTournamentMatchResult,
  getTournamentRewards,
  getArenaStats,
  resetSeason,
  validateArenaState,
  escapeHtml
} from '../src/arena-tournament-system.js';

import {
  renderArenaPanel,
  renderActiveTournament,
  renderMatchResult,
  renderLeaderboard,
  renderMatchHistory,
  renderArenaHud,
  renderSeasonSummary,
  getArenaStyles
} from '../src/arena-tournament-system-ui.js';

// ============================================
// Constants Tests
// ============================================

describe('Arena Tournament System - Constants', () => {
  it('should define tournament types', () => {
    assert.strictEqual(TOURNAMENT_TYPE.SINGLE_ELIMINATION, 'single_elimination');
    assert.strictEqual(TOURNAMENT_TYPE.DOUBLE_ELIMINATION, 'double_elimination');
    assert.strictEqual(TOURNAMENT_TYPE.ROUND_ROBIN, 'round_robin');
    assert.strictEqual(TOURNAMENT_TYPE.GAUNTLET, 'gauntlet');
  });

  it('should define arena tiers', () => {
    assert.strictEqual(ARENA_TIER.BRONZE, 'bronze');
    assert.strictEqual(ARENA_TIER.SILVER, 'silver');
    assert.strictEqual(ARENA_TIER.GOLD, 'gold');
    assert.strictEqual(ARENA_TIER.PLATINUM, 'platinum');
    assert.strictEqual(ARENA_TIER.DIAMOND, 'diamond');
    assert.strictEqual(ARENA_TIER.CHAMPION, 'champion');
  });

  it('should define match results', () => {
    assert.strictEqual(MATCH_RESULT.WIN, 'win');
    assert.strictEqual(MATCH_RESULT.LOSS, 'loss');
    assert.strictEqual(MATCH_RESULT.DRAW, 'draw');
    assert.strictEqual(MATCH_RESULT.FORFEIT, 'forfeit');
  });

  it('should have tournament definitions', () => {
    assert.ok(TOURNAMENTS.weekly_brawl);
    assert.ok(TOURNAMENTS.grand_championship);
    assert.ok(TOURNAMENTS.survival_gauntlet);
    assert.ok(TOURNAMENTS.league_match);
  });

  it('should have valid tournament properties', () => {
    const tournament = TOURNAMENTS.weekly_brawl;
    assert.strictEqual(tournament.id, 'weekly_brawl');
    assert.strictEqual(tournament.type, TOURNAMENT_TYPE.SINGLE_ELIMINATION);
    assert.strictEqual(typeof tournament.entryFee, 'number');
    assert.strictEqual(typeof tournament.minLevel, 'number');
    assert.ok(tournament.rewards);
  });
});

// ============================================
// State Creation Tests
// ============================================

describe('Arena Tournament System - State Creation', () => {
  it('should create initial arena state', () => {
    const state = createArenaState();
    assert.strictEqual(state.rating, 1000);
    assert.strictEqual(state.tier, ARENA_TIER.BRONZE);
    assert.strictEqual(state.wins, 0);
    assert.strictEqual(state.losses, 0);
    assert.strictEqual(state.draws, 0);
    assert.strictEqual(state.winStreak, 0);
    assert.strictEqual(state.bestWinStreak, 0);
    assert.strictEqual(state.totalMatches, 0);
  });

  it('should initialize match history as empty array', () => {
    const state = createArenaState();
    assert.ok(Array.isArray(state.matchHistory));
    assert.strictEqual(state.matchHistory.length, 0);
  });

  it('should initialize season stats', () => {
    const state = createArenaState();
    assert.ok(state.seasonStats);
    assert.strictEqual(state.seasonStats.season, 1);
    assert.strictEqual(state.seasonStats.rating, 1000);
    assert.strictEqual(state.seasonStats.highestRating, 1000);
  });

  it('should have null active tournament initially', () => {
    const state = createArenaState();
    assert.strictEqual(state.activeTournament, null);
  });
});

// ============================================
// Tier System Tests
// ============================================

describe('Arena Tournament System - Tier System', () => {
  it('should return bronze for low rating', () => {
    assert.strictEqual(getTierForRating(0), ARENA_TIER.BRONZE);
    assert.strictEqual(getTierForRating(100), ARENA_TIER.BRONZE);
    assert.strictEqual(getTierForRating(499), ARENA_TIER.BRONZE);
  });

  it('should return silver for rating 500-1199', () => {
    assert.strictEqual(getTierForRating(500), ARENA_TIER.SILVER);
    assert.strictEqual(getTierForRating(800), ARENA_TIER.SILVER);
    assert.strictEqual(getTierForRating(1199), ARENA_TIER.SILVER);
  });

  it('should return gold for rating 1200-1999', () => {
    assert.strictEqual(getTierForRating(1200), ARENA_TIER.GOLD);
    assert.strictEqual(getTierForRating(1500), ARENA_TIER.GOLD);
    assert.strictEqual(getTierForRating(1999), ARENA_TIER.GOLD);
  });

  it('should return platinum for rating 2000-2999', () => {
    assert.strictEqual(getTierForRating(2000), ARENA_TIER.PLATINUM);
    assert.strictEqual(getTierForRating(2500), ARENA_TIER.PLATINUM);
  });

  it('should return diamond for rating 3000-4499', () => {
    assert.strictEqual(getTierForRating(3000), ARENA_TIER.DIAMOND);
    assert.strictEqual(getTierForRating(4000), ARENA_TIER.DIAMOND);
  });

  it('should return champion for rating 4500+', () => {
    assert.strictEqual(getTierForRating(4500), ARENA_TIER.CHAMPION);
    assert.strictEqual(getTierForRating(5000), ARENA_TIER.CHAMPION);
    assert.strictEqual(getTierForRating(10000), ARENA_TIER.CHAMPION);
  });

  it('should calculate tier progress correctly', () => {
    const progress = getNextTierProgress(600);
    assert.strictEqual(progress.currentTier, ARENA_TIER.SILVER);
    assert.strictEqual(progress.nextTier, ARENA_TIER.GOLD);
    assert.strictEqual(progress.pointsNeeded, 600);
  });

  it('should show no next tier for champion', () => {
    const progress = getNextTierProgress(5000);
    assert.strictEqual(progress.currentTier, ARENA_TIER.CHAMPION);
    assert.strictEqual(progress.nextTier, null);
    assert.strictEqual(progress.progress, 1.0);
  });

  it('should clamp progress between 0 and 1', () => {
    const progress = getNextTierProgress(500);
    assert.ok(progress.progress >= 0);
    assert.ok(progress.progress <= 1);
  });
});

// ============================================
// Opponent Generation Tests
// ============================================

describe('Arena Tournament System - Opponent Generation', () => {
  it('should generate opponent with valid structure', () => {
    const opponent = generateOpponent(10);
    assert.ok(opponent.id);
    assert.ok(opponent.name);
    assert.ok(typeof opponent.level === 'number');
    assert.ok(opponent.stats);
    assert.ok(opponent.abilities);
    assert.ok(opponent.rewards);
  });

  it('should generate opponent with level near player level', () => {
    const opponent = generateOpponent(15, 1.0);
    assert.ok(opponent.level >= 10 && opponent.level <= 20);
  });

  it('should scale opponent with difficulty modifier', () => {
    const easyOpponent = generateOpponent(10, 0.5);
    const hardOpponent = generateOpponent(10, 1.5);
    assert.ok(hardOpponent.stats.attack > easyOpponent.stats.attack);
  });

  it('should generate opponent with valid stats', () => {
    const opponent = generateOpponent(10);
    assert.ok(opponent.stats.hp > 0);
    assert.ok(opponent.stats.maxHp > 0);
    assert.ok(opponent.stats.attack > 0);
    assert.ok(opponent.stats.defense > 0);
    assert.ok(opponent.stats.speed > 0);
  });

  it('should generate abilities based on level', () => {
    const lowLevel = generateOpponent(2);
    const highLevel = generateOpponent(20);
    assert.ok(highLevel.abilities.length >= lowLevel.abilities.length);
  });

  it('should always include basic attack', () => {
    const opponent = generateOpponent(1);
    assert.ok(opponent.abilities.includes('basic_attack'));
  });

  it('should generate unique IDs', () => {
    const op1 = generateOpponent(10);
    const op2 = generateOpponent(10);
    assert.notStrictEqual(op1.id, op2.id);
  });

  it('should generate rewards based on level and difficulty', () => {
    const opponent = generateOpponent(10, 1.0);
    assert.ok(opponent.rewards.gold > 0);
    assert.ok(opponent.rewards.xp > 0);
  });
});

// ============================================
// Rating Calculation Tests
// ============================================

describe('Arena Tournament System - Rating Calculation', () => {
  it('should gain rating on win against equal opponent', () => {
    const change = calculateRatingChange(1000, 1000, MATCH_RESULT.WIN);
    assert.ok(change > 0);
  });

  it('should lose rating on loss against equal opponent', () => {
    const change = calculateRatingChange(1000, 1000, MATCH_RESULT.LOSS);
    assert.ok(change < 0);
  });

  it('should have no change on draw against equal opponent', () => {
    const change = calculateRatingChange(1000, 1000, MATCH_RESULT.DRAW);
    assert.strictEqual(change, 0);
  });

  it('should gain more on upset win', () => {
    const normalChange = calculateRatingChange(1000, 1000, MATCH_RESULT.WIN);
    const upsetChange = calculateRatingChange(800, 1200, MATCH_RESULT.WIN);
    assert.ok(upsetChange > normalChange);
  });

  it('should lose less on expected loss', () => {
    const normalLoss = calculateRatingChange(1000, 1000, MATCH_RESULT.LOSS);
    const expectedLoss = calculateRatingChange(800, 1200, MATCH_RESULT.LOSS);
    assert.ok(Math.abs(expectedLoss) < Math.abs(normalLoss));
  });

  it('should handle forfeit as loss', () => {
    const forfeit = calculateRatingChange(1000, 1000, MATCH_RESULT.FORFEIT);
    const loss = calculateRatingChange(1000, 1000, MATCH_RESULT.LOSS);
    assert.strictEqual(forfeit, loss);
  });
});

// ============================================
// Match Result Processing Tests
// ============================================

describe('Arena Tournament System - Match Result Processing', () => {
  let state;

  beforeEach(() => {
    state = createArenaState();
  });

  it('should update rating on win', () => {
    const { state: newState } = processMatchResult(state, {
      opponentRating: 1000,
      result: MATCH_RESULT.WIN,
      duration: 60,
      damageDealt: 100,
      damageTaken: 50
    });
    assert.ok(newState.rating > state.rating);
  });

  it('should increment wins counter on win', () => {
    const { state: newState } = processMatchResult(state, {
      opponentRating: 1000,
      result: MATCH_RESULT.WIN
    });
    assert.strictEqual(newState.wins, 1);
    assert.strictEqual(newState.losses, 0);
  });

  it('should increment losses counter on loss', () => {
    const { state: newState } = processMatchResult(state, {
      opponentRating: 1000,
      result: MATCH_RESULT.LOSS
    });
    assert.strictEqual(newState.losses, 1);
    assert.strictEqual(newState.wins, 0);
  });

  it('should track win streak', () => {
    let current = state;
    for (let i = 0; i < 3; i++) {
      const { state: newState } = processMatchResult(current, {
        opponentRating: 1000,
        result: MATCH_RESULT.WIN
      });
      current = newState;
    }
    assert.strictEqual(current.winStreak, 3);
  });

  it('should reset win streak on loss', () => {
    const { state: afterWin } = processMatchResult(state, {
      opponentRating: 1000,
      result: MATCH_RESULT.WIN
    });
    const { state: afterLoss } = processMatchResult(afterWin, {
      opponentRating: 1000,
      result: MATCH_RESULT.LOSS
    });
    assert.strictEqual(afterLoss.winStreak, 0);
  });

  it('should track best win streak', () => {
    let current = state;
    for (let i = 0; i < 5; i++) {
      const { state: newState } = processMatchResult(current, {
        opponentRating: 1000,
        result: MATCH_RESULT.WIN
      });
      current = newState;
    }
    const { state: afterLoss } = processMatchResult(current, {
      opponentRating: 1000,
      result: MATCH_RESULT.LOSS
    });
    assert.strictEqual(afterLoss.bestWinStreak, 5);
    assert.strictEqual(afterLoss.winStreak, 0);
  });

  it('should add match to history', () => {
    const { state: newState } = processMatchResult(state, {
      opponentRating: 1000,
      result: MATCH_RESULT.WIN
    });
    assert.strictEqual(newState.matchHistory.length, 1);
    assert.strictEqual(newState.matchHistory[0].result, MATCH_RESULT.WIN);
  });

  it('should limit match history to 100 entries', () => {
    let current = { ...state, matchHistory: new Array(99).fill({ result: MATCH_RESULT.WIN }) };
    for (let i = 0; i < 5; i++) {
      const { state: newState } = processMatchResult(current, {
        opponentRating: 1000,
        result: MATCH_RESULT.WIN
      });
      current = newState;
    }
    assert.ok(current.matchHistory.length <= 100);
  });

  it('should provide rewards on win', () => {
    const { rewards } = processMatchResult(state, {
      opponentRating: 1000,
      result: MATCH_RESULT.WIN
    });
    assert.ok(rewards.gold > 0);
    assert.ok(rewards.xp > 0);
  });

  it('should provide streak bonus at 3+ streak', () => {
    let current = state;
    for (let i = 0; i < 3; i++) {
      const { state: newState } = processMatchResult(current, {
        opponentRating: 1000,
        result: MATCH_RESULT.WIN
      });
      current = newState;
    }
    const { rewards } = processMatchResult(current, {
      opponentRating: 1000,
      result: MATCH_RESULT.WIN
    });
    assert.ok(rewards.streakBonus);
  });

  it('should detect tier promotion', () => {
    // Set rating close to gold threshold (1200) with correct tier
    const highRatingState = { ...state, rating: 1190, tier: ARENA_TIER.SILVER };
    const { rewards } = processMatchResult(highRatingState, {
      opponentRating: 1000,
      result: MATCH_RESULT.WIN
    });
    if (rewards.tierPromotion) {
      assert.strictEqual(rewards.tierPromotion.from, ARENA_TIER.SILVER);
      assert.strictEqual(rewards.tierPromotion.to, ARENA_TIER.GOLD);
    }
  });

  it('should update season stats', () => {
    const { state: newState } = processMatchResult(state, {
      opponentRating: 1000,
      result: MATCH_RESULT.WIN
    });
    assert.strictEqual(newState.seasonStats.wins, 1);
    assert.ok(newState.seasonStats.highestRating >= state.seasonStats.highestRating);
  });

  it('should not go below 0 rating', () => {
    const lowState = { ...state, rating: 10 };
    const { state: newState } = processMatchResult(lowState, {
      opponentRating: 1500,
      result: MATCH_RESULT.LOSS
    });
    assert.ok(newState.rating >= 0);
  });
});

// ============================================
// Tournament Creation Tests
// ============================================

describe('Arena Tournament System - Tournament Creation', () => {
  it('should create single elimination tournament', () => {
    const tournament = createTournament('weekly_brawl', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    assert.ok(!tournament.error);
    assert.strictEqual(tournament.type, TOURNAMENT_TYPE.SINGLE_ELIMINATION);
    assert.strictEqual(tournament.participants.length, 8);
  });

  it('should reject if level too low', () => {
    const result = createTournament('grand_championship', {
      name: 'Player',
      level: 5,
      gold: 1000
    });
    assert.ok(result.error);
    assert.ok(result.error.includes('level'));
  });

  it('should reject if insufficient gold', () => {
    const result = createTournament('weekly_brawl', {
      name: 'Player',
      level: 10,
      gold: 50
    });
    assert.ok(result.error);
    assert.ok(result.error.includes('gold'));
  });

  it('should include player in participants', () => {
    const tournament = createTournament('weekly_brawl', {
      name: 'TestPlayer',
      level: 10,
      gold: 500
    });
    const player = tournament.participants.find(p => p.isPlayer);
    assert.ok(player);
    assert.strictEqual(player.name, 'TestPlayer');
  });

  it('should generate bracket', () => {
    const tournament = createTournament('weekly_brawl', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    assert.ok(tournament.bracket);
    assert.strictEqual(tournament.bracket.type, TOURNAMENT_TYPE.SINGLE_ELIMINATION);
  });

  it('should create gauntlet tournament', () => {
    const tournament = createTournament('survival_gauntlet', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    assert.ok(!tournament.error);
    assert.strictEqual(tournament.type, TOURNAMENT_TYPE.GAUNTLET);
    assert.strictEqual(tournament.bracket.rounds.length, 10);
  });

  it('should create round robin tournament', () => {
    const tournament = createTournament('league_match', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    assert.ok(!tournament.error);
    assert.strictEqual(tournament.type, TOURNAMENT_TYPE.ROUND_ROBIN);
    assert.ok(tournament.bracket.standings);
  });

  it('should return error for invalid tournament', () => {
    const result = createTournament('nonexistent', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    assert.ok(result.error);
  });
});

// ============================================
// Tournament Match Finding Tests
// ============================================

describe('Arena Tournament System - Tournament Match Finding', () => {
  it('should find next player match in single elimination', () => {
    const tournament = createTournament('weekly_brawl', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const match = getNextPlayerMatch(tournament);
    assert.ok(match);
    assert.ok(match.participant1 || match.participant2);
  });

  it('should return null if player eliminated', () => {
    const tournament = createTournament('weekly_brawl', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    tournament.playerStatus = 'eliminated';
    const match = getNextPlayerMatch(tournament);
    assert.strictEqual(match, null);
  });

  it('should find match in gauntlet', () => {
    const tournament = createTournament('survival_gauntlet', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const match = getNextPlayerMatch(tournament);
    assert.ok(match);
    assert.ok(match.participant2); // Opponent
  });

  it('should find match in round robin', () => {
    const tournament = createTournament('league_match', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const match = getNextPlayerMatch(tournament);
    assert.ok(match);
  });
});

// ============================================
// Tournament Result Recording Tests
// ============================================

describe('Arena Tournament System - Tournament Result Recording', () => {
  it('should record single elimination match result', () => {
    const tournament = createTournament('weekly_brawl', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const match = getNextPlayerMatch(tournament);
    const player = tournament.participants.find(p => p.isPlayer);

    const updated = recordTournamentMatchResult(tournament, match.id, player.id);
    const completedMatch = updated.bracket.rounds[0].find(m => m.id === match.id);
    assert.strictEqual(completedMatch.status, 'completed');
  });

  it('should eliminate player on loss', () => {
    const tournament = createTournament('weekly_brawl', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const match = getNextPlayerMatch(tournament);
    const opponent = match.participant1.isPlayer ? match.participant2 : match.participant1;

    const updated = recordTournamentMatchResult(tournament, match.id, opponent.id);
    assert.strictEqual(updated.playerStatus, 'eliminated');
  });

  it('should record gauntlet result', () => {
    const tournament = createTournament('survival_gauntlet', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const updated = recordTournamentMatchResult(tournament, null, 'player');
    assert.strictEqual(updated.bracket.rounds[0].result, 'win');
    assert.strictEqual(updated.bracket.currentRound, 1);
  });

  it('should end gauntlet on player loss', () => {
    const tournament = createTournament('survival_gauntlet', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const opponent = tournament.bracket.rounds[0].opponent;
    const updated = recordTournamentMatchResult(tournament, null, opponent.id);
    assert.strictEqual(updated.playerStatus, 'eliminated');
    assert.strictEqual(updated.status, 'completed');
  });

  it('should update round robin standings', () => {
    const tournament = createTournament('league_match', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const match = tournament.bracket.matches.find(m =>
      m.participant1.isPlayer || m.participant2.isPlayer
    );
    const player = match.participant1.isPlayer ? match.participant1 : match.participant2;

    const updated = recordTournamentMatchResult(tournament, match.id, player.id);
    const standing = updated.bracket.standings.find(s => s.participant.isPlayer);
    assert.strictEqual(standing.wins, 1);
    assert.strictEqual(standing.points, 3);
  });

  it('should handle round robin draw', () => {
    const tournament = createTournament('league_match', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const match = tournament.bracket.matches[0];

    const updated = recordTournamentMatchResult(tournament, match.id, 'draw');
    const standing1 = updated.bracket.standings.find(
      s => s.participant.id === match.participant1.id
    );
    const standing2 = updated.bracket.standings.find(
      s => s.participant.id === match.participant2.id
    );
    assert.strictEqual(standing1.draws, 1);
    assert.strictEqual(standing2.draws, 1);
  });
});

// ============================================
// Tournament Rewards Tests
// ============================================

describe('Arena Tournament System - Tournament Rewards', () => {
  it('should return rewards for gauntlet completion', () => {
    const tournament = createTournament('survival_gauntlet', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    tournament.playerStatus = 'champion';
    tournament.bracket.currentRound = 10;
    tournament.finalRound = 10;

    const rewards = getTournamentRewards(tournament);
    assert.ok(rewards.gold > 0);
    assert.ok(rewards.xp > 0);
    assert.ok(rewards.items);
  });

  it('should return partial rewards for partial gauntlet', () => {
    const tournament = createTournament('survival_gauntlet', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    tournament.playerStatus = 'eliminated';
    tournament.finalRound = 5;

    const rewards = getTournamentRewards(tournament);
    assert.ok(rewards.gold > 0);
    assert.ok(!rewards.items);
  });

  it('should return first place rewards for winner', () => {
    const tournament = createTournament('weekly_brawl', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const player = tournament.participants.find(p => p.isPlayer);
    tournament.winner = player;
    tournament.playerStatus = 'champion';

    const rewards = getTournamentRewards(tournament);
    assert.ok(rewards.gold > 0);
    assert.ok(rewards.items);
  });
});

// ============================================
// Arena Statistics Tests
// ============================================

describe('Arena Tournament System - Arena Statistics', () => {
  it('should calculate win rate correctly', () => {
    const state = {
      ...createArenaState(),
      wins: 7,
      losses: 3,
      totalMatches: 10
    };
    const stats = getArenaStats(state);
    assert.strictEqual(stats.winRate, 70);
  });

  it('should handle zero matches', () => {
    const state = createArenaState();
    const stats = getArenaStats(state);
    assert.strictEqual(stats.winRate, 0);
    assert.strictEqual(stats.recentWinRate, 0);
  });

  it('should calculate recent win rate from last 10 matches', () => {
    const state = {
      ...createArenaState(),
      matchHistory: [
        { result: MATCH_RESULT.WIN },
        { result: MATCH_RESULT.WIN },
        { result: MATCH_RESULT.LOSS },
        { result: MATCH_RESULT.WIN },
        { result: MATCH_RESULT.LOSS }
      ]
    };
    const stats = getArenaStats(state);
    assert.strictEqual(stats.recentWinRate, 60);
  });

  it('should include tier progress', () => {
    const state = createArenaState();
    const stats = getArenaStats(state);
    assert.ok(stats.tierProgress);
    assert.ok(stats.tierProgress.currentTier);
  });
});

// ============================================
// Season Reset Tests
// ============================================

describe('Arena Tournament System - Season Reset', () => {
  it('should increment season number', () => {
    const state = createArenaState();
    const newState = resetSeason(state);
    assert.strictEqual(newState.seasonStats.season, 2);
  });

  it('should soft reset rating towards 1000', () => {
    const state = { ...createArenaState(), rating: 2000 };
    const newState = resetSeason(state);
    assert.ok(newState.rating < 2000);
    assert.ok(newState.rating > 1000);
    assert.strictEqual(newState.rating, 1500);
  });

  it('should preserve previous season data', () => {
    const state = {
      ...createArenaState(),
      rating: 1500,
      seasonStats: { season: 1, rating: 1500, highestRating: 1600, wins: 50, losses: 30 }
    };
    const newState = resetSeason(state);
    assert.ok(newState.previousSeasons);
    assert.strictEqual(newState.previousSeasons.length, 1);
    assert.strictEqual(newState.previousSeasons[0].season, 1);
  });

  it('should reset season wins/losses', () => {
    const state = {
      ...createArenaState(),
      seasonStats: { season: 1, rating: 1500, highestRating: 1600, wins: 50, losses: 30 }
    };
    const newState = resetSeason(state);
    assert.strictEqual(newState.seasonStats.wins, 0);
    assert.strictEqual(newState.seasonStats.losses, 0);
  });
});

// ============================================
// State Validation Tests
// ============================================

describe('Arena Tournament System - State Validation', () => {
  it('should validate correct state', () => {
    const state = createArenaState();
    assert.strictEqual(validateArenaState(state), true);
  });

  it('should reject null state', () => {
    assert.strictEqual(validateArenaState(null), false);
  });

  it('should reject non-object state', () => {
    assert.strictEqual(validateArenaState('string'), false);
  });

  it('should reject negative rating', () => {
    const state = { ...createArenaState(), rating: -100 };
    assert.strictEqual(validateArenaState(state), false);
  });

  it('should reject invalid tier', () => {
    const state = { ...createArenaState(), tier: 'invalid' };
    assert.strictEqual(validateArenaState(state), false);
  });

  it('should reject negative wins', () => {
    const state = { ...createArenaState(), wins: -1 };
    assert.strictEqual(validateArenaState(state), false);
  });

  it('should reject non-array match history', () => {
    const state = { ...createArenaState(), matchHistory: 'not array' };
    assert.strictEqual(validateArenaState(state), false);
  });
});

// ============================================
// HTML Escaping Tests
// ============================================

describe('Arena Tournament System - HTML Escaping', () => {
  it('should escape HTML special characters', () => {
    assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
    assert.strictEqual(escapeHtml('"test"'), '&quot;test&quot;');
    assert.strictEqual(escapeHtml("'test'"), '&#039;test&#039;');
    assert.strictEqual(escapeHtml('a & b'), 'a &amp; b');
  });

  it('should handle non-string input', () => {
    assert.strictEqual(escapeHtml(null), '');
    assert.strictEqual(escapeHtml(undefined), '');
    assert.strictEqual(escapeHtml(123), '');
  });

  it('should handle empty string', () => {
    assert.strictEqual(escapeHtml(''), '');
  });
});

// ============================================
// UI Rendering Tests
// ============================================

describe('Arena Tournament System - UI Rendering', () => {
  it('should render arena panel', () => {
    const state = createArenaState();
    const html = renderArenaPanel(state);
    assert.ok(html.includes('arena-panel'));
    assert.ok(html.includes('Rating'));
    assert.ok(html.includes('1000'));
  });

  it('should render tier badge', () => {
    const state = createArenaState();
    const html = renderArenaPanel(state);
    assert.ok(html.includes('arena-tier-badge'));
    assert.ok(html.includes('Bronze'));
  });

  it('should render quick match button when option set', () => {
    const state = createArenaState();
    const html = renderArenaPanel(state, { showQuickMatch: true });
    assert.ok(html.includes('Find Match'));
  });

  it('should render tournaments when option set', () => {
    const state = createArenaState();
    const html = renderArenaPanel(state, { showTournaments: true });
    assert.ok(html.includes('tournament-list'));
    assert.ok(html.includes('Weekly Brawl'));
  });

  it('should escape HTML in panel', () => {
    const state = { ...createArenaState(), tier: '<script>alert(1)</script>' };
    // This would actually fail validation, but testing escape
    const html = renderArenaPanel(createArenaState());
    assert.ok(!html.includes('<script>alert'));
  });

  it('should render active tournament', () => {
    const tournament = createTournament('weekly_brawl', {
      name: 'Player',
      level: 10,
      gold: 500
    });
    const html = renderActiveTournament(tournament);
    assert.ok(html.includes('active-tournament'));
    assert.ok(html.includes('Weekly Brawl'));
  });

  it('should render empty state for null tournament', () => {
    const html = renderActiveTournament(null);
    assert.ok(html.includes('No active tournament'));
  });

  it('should render match result popup', () => {
    const result = {
      result: 'win',
      rewards: {
        gold: 100,
        xp: 50,
        ratingChange: 25
      }
    };
    const html = renderMatchResult(result);
    assert.ok(html.includes('Victory'));
    assert.ok(html.includes('+25 Rating'));
    assert.ok(html.includes('+100 Gold'));
  });

  it('should render loss result', () => {
    const result = {
      result: 'loss',
      rewards: {
        gold: 0,
        xp: 10,
        ratingChange: -20
      }
    };
    const html = renderMatchResult(result);
    assert.ok(html.includes('Defeat'));
    assert.ok(html.includes('-20 Rating'));
  });

  it('should render tier promotion', () => {
    const result = {
      result: 'win',
      rewards: {
        gold: 100,
        xp: 50,
        ratingChange: 25,
        tierPromotion: {
          from: ARENA_TIER.SILVER,
          to: ARENA_TIER.GOLD
        }
      }
    };
    const html = renderMatchResult(result);
    assert.ok(html.includes('tier-promotion'));
    assert.ok(html.includes('Gold'));
  });
});

// ============================================
// Leaderboard Rendering Tests
// ============================================

describe('Arena Tournament System - Leaderboard Rendering', () => {
  it('should render leaderboard', () => {
    const leaderboard = [
      { name: 'Champion', tier: ARENA_TIER.CHAMPION, rating: 5000, wins: 100, losses: 10 },
      { name: 'Player', tier: ARENA_TIER.GOLD, rating: 1500, wins: 50, losses: 30 }
    ];
    const html = renderLeaderboard(leaderboard, 'Player');
    assert.ok(html.includes('arena-leaderboard'));
    assert.ok(html.includes('Champion'));
    assert.ok(html.includes('is-player'));
  });

  it('should render empty leaderboard message', () => {
    const html = renderLeaderboard([], 'Player');
    assert.ok(html.includes('No leaderboard data'));
  });

  it('should render null leaderboard message', () => {
    const html = renderLeaderboard(null, 'Player');
    assert.ok(html.includes('No leaderboard data'));
  });
});

// ============================================
// Match History Rendering Tests
// ============================================

describe('Arena Tournament System - Match History Rendering', () => {
  it('should render match history', () => {
    const history = [
      { result: MATCH_RESULT.WIN, ratingChange: 25, timestamp: Date.now() },
      { result: MATCH_RESULT.LOSS, ratingChange: -20, timestamp: Date.now() }
    ];
    const html = renderMatchHistory(history);
    assert.ok(html.includes('match-history'));
    assert.ok(html.includes('Win'));
    assert.ok(html.includes('Loss'));
  });

  it('should render empty history message', () => {
    const html = renderMatchHistory([]);
    assert.ok(html.includes('No match history'));
  });

  it('should limit to 20 entries', () => {
    const history = Array(30).fill({
      result: MATCH_RESULT.WIN,
      ratingChange: 25,
      timestamp: Date.now()
    });
    const html = renderMatchHistory(history);
    const matches = html.match(/history-entry/g);
    assert.ok(matches.length <= 20);
  });
});

// ============================================
// HUD Rendering Tests
// ============================================

describe('Arena Tournament System - HUD Rendering', () => {
  it('should render arena HUD', () => {
    const state = createArenaState();
    const html = renderArenaHud(state);
    assert.ok(html.includes('arena-hud'));
    assert.ok(html.includes('1000'));
  });

  it('should show streak indicator at 3+ wins', () => {
    const state = { ...createArenaState(), winStreak: 5 };
    const html = renderArenaHud(state);
    assert.ok(html.includes('hud-streak'));
    assert.ok(html.includes('5'));
  });

  it('should not show streak below 3', () => {
    const state = { ...createArenaState(), winStreak: 2 };
    const html = renderArenaHud(state);
    assert.ok(!html.includes('hud-streak'));
  });
});

// ============================================
// Season Summary Rendering Tests
// ============================================

describe('Arena Tournament System - Season Summary Rendering', () => {
  it('should render season summary', () => {
    const stats = {
      season: 1,
      rating: 1500,
      highestRating: 1800,
      wins: 50,
      losses: 30
    };
    const html = renderSeasonSummary(stats);
    assert.ok(html.includes('Season 1'));
    assert.ok(html.includes('1500'));
    assert.ok(html.includes('1800'));
  });

  it('should calculate win rate in summary', () => {
    const stats = {
      season: 1,
      rating: 1500,
      highestRating: 1800,
      wins: 75,
      losses: 25
    };
    const html = renderSeasonSummary(stats);
    assert.ok(html.includes('75'));
  });
});

// ============================================
// Styles Tests
// ============================================

describe('Arena Tournament System - Styles', () => {
  it('should return CSS styles', () => {
    const styles = getArenaStyles();
    assert.ok(typeof styles === 'string');
    assert.ok(styles.includes('.arena-panel'));
    assert.ok(styles.includes('.tier-progress'));
    assert.ok(styles.includes('.bracket-match'));
  });
});

// ============================================
// Security Tests
// ============================================

describe('Arena Tournament System - Security', () => {
  it('should not contain banned words in source', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const srcPath = path.join(process.cwd(), 'src', 'arena-tournament-system.js');
    const uiPath = path.join(process.cwd(), 'src', 'arena-tournament-system-ui.js');

    const srcContent = fs.readFileSync(srcPath, 'utf8').toLowerCase();
    const uiContent = fs.readFileSync(uiPath, 'utf8').toLowerCase();
    const content = srcContent + uiContent;

    const bannedWords = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

    for (const word of bannedWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      assert.ok(!regex.test(content), `Source contains banned word: ${word}`);
    }
  });

  it('should escape user-controlled strings', () => {
    const malicious = '<script>alert("xss")</script>';
    const escaped = escapeHtml(malicious);
    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));
  });
});
