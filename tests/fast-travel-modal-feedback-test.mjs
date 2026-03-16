import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { handleFastTravelAction } from '../src/handlers/exploration-handler.js';

describe('Fast Travel empty-state feedback', () => {
  it('opens the fast travel modal when no destinations are unlocked yet', () => {
    const state = {
      phase: 'exploration',
      visitedRooms: [],
      fastTravelModalOpen: false,
      log: [],
    };

    const next = handleFastTravelAction(state, { type: 'OPEN_FAST_TRAVEL' });

    assert.equal(next.fastTravelModalOpen, true);
    assert.deepStrictEqual(next.log, []);
  });

  it('still ignores open-fast-travel outside exploration', () => {
    const state = {
      phase: 'combat',
      visitedRooms: [[1, 1]],
      fastTravelModalOpen: false,
      log: ['existing'],
    };

    const next = handleFastTravelAction(state, { type: 'OPEN_FAST_TRAVEL' });

    assert.equal(next, null);
  });
});
