import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { handleSystemAction } from '../src/handlers/system-handler.js';
import { handleSlotAction } from '../src/save-management-ui.js';
import { getSaveSlots, loadFromSlot } from '../src/engine.js';

const store = {};
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem(key) { return store[key] ?? null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { for (const k of Object.keys(store)) delete store[k]; },
  };
}

function clearSaveSlots() {
  for (let i = 0; i < 5; i += 1) {
    globalThis.localStorage.removeItem(`aiVillageRpg_slot_${i}`);
  }
}

function makeVillageSquareState(overrides = {}) {
  return {
    phase: 'save-slots',
    saveSlotMode: 'save',
    player: { name: 'ManualHero', level: 3, classId: 'warrior', hp: 50, maxHp: 50 },
    world: { roomRow: 1, roomCol: 1, x: 4, y: 3 },
    turn: 12,
    log: [],
    ...overrides,
  };
}

describe('Manual save location regression', () => {
  beforeEach(() => {
    clearSaveSlots();
  });

  it('system-handler SAVE_TO_SLOT stores Village Square for manual saves', () => {
    const state = makeVillageSquareState();

    const next = handleSystemAction(state, { type: 'SAVE_TO_SLOT', slotIndex: 0 });

    assert.equal(next.saveSlots[0].location, 'Village Square');
    assert.notEqual(next.saveSlots[0].location, 'Unknown Location');

    const saved = loadFromSlot(0);
    assert.equal(saved.saveMetadata?.location, 'Village Square');
    assert.equal(saved.location, 'Village Square');
  });

  it('save-management-ui manual save flow stores Village Square for displayed slot location', () => {
    const originalPrompt = globalThis.prompt;
    const originalAlert = globalThis.alert;
    const originalDocument = globalThis.document;
    const originalCustomEvent = globalThis.CustomEvent;

    const state = makeVillageSquareState();
    globalThis.prompt = () => 'manual-save';
    globalThis.alert = () => {};
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    };
    globalThis.document = {
      dispatchEvent(event) {
        if (event.type === 'save-ui:request-state') {
          event.detail.state = state;
        }
        return true;
      },
    };

    try {
      handleSlotAction('save', 1);
    } finally {
      globalThis.prompt = originalPrompt;
      globalThis.alert = originalAlert;
      globalThis.document = originalDocument;
      globalThis.CustomEvent = originalCustomEvent;
    }

    const slots = getSaveSlots();
    assert.equal(slots[1].location, 'Village Square');
    assert.notEqual(slots[1].location, 'Unknown Location');

    const saved = loadFromSlot(1);
    assert.equal(saved.customName, 'manual-save');
    assert.equal(saved.saveMetadata?.location, 'Village Square');
    assert.equal(saved.location, 'Village Square');
  });
});
