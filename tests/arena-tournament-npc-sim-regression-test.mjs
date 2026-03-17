/**
 * Regression: Arena tournaments should not get stuck at "No matches available"
 * after the player completes a match.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { initialStateWithClass } from '../src/state.js';
import { handleUIAction } from '../src/handlers/ui-handler.js';
import { getNextPlayerMatch } from '../src/arena-tournament-system.js';

function lastLogLine(state) {
  return state?.log?.[state.log.length - 1];
}

describe('Arena tournaments - NPC simulation', () => {
  it('auto-simulates NPC-only matches so the player always has a next match (or tournament ends)', () => {
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
      let state = initialStateWithClass('warrior', 'ArenaTest');
      state = {
        ...state,
        phase: 'exploration',
        player: {
          ...state.player,
          level: 5,
          gold: 500
        }
      };

      const entered = handleUIAction(state, { type: 'ENTER_TOURNAMENT', tournamentId: 'weekly_brawl' });
      assert.ok(entered, 'expected ENTER_TOURNAMENT to return a next state');

      const activeId = entered.arenaState?.activeTournament;
      assert.strictEqual(activeId, 'weekly_brawl');

      const t0 = entered.arenaState?.tournaments?.[activeId];
      assert.ok(t0);
      assert.strictEqual(t0.playerStatus, 'active');

      const after1 = handleUIAction(entered, { type: 'NEXT_TOURNAMENT_MATCH' });
      assert.ok(after1, 'expected NEXT_TOURNAMENT_MATCH to return a next state');
      assert.notStrictEqual(lastLogLine(after1), 'No matches available.');

      const t1 = after1.arenaState?.tournaments?.[activeId];
      assert.ok(t1);
      assert.strictEqual(t1.playerStatus, 'active');

      // In the stuck bug, the tournament is still active but the next match is unavailable.
      const nextMatch = getNextPlayerMatch(t1);
      assert.ok(
        nextMatch || t1.status === 'completed',
        'expected a next player match to be available after match 1 (or tournament completed)'
      );

      // Extra signal: at least one NPC-only match should have been resolved
      // to ensure the player’s next bracket match can become pending.
      const rounds = t1?.bracket?.rounds;
      if (Array.isArray(rounds) && Array.isArray(rounds[0])) {
        const completedInRound0 = rounds[0].filter(m => m?.status === 'completed').length;
        assert.ok(
          completedInRound0 >= 2,
          `expected >=2 completed matches in round 0 after first player match; got ${completedInRound0}`
        );
      }

      const after2 = handleUIAction(after1, { type: 'NEXT_TOURNAMENT_MATCH' });
      assert.ok(after2, 'expected a second NEXT_TOURNAMENT_MATCH to return a next state');
      assert.notStrictEqual(lastLogLine(after2), 'No matches available.');
    } finally {
      Math.random = originalRandom;
    }
  });
});
