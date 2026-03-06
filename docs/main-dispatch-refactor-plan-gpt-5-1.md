# `src/main.js` Dispatch & State Controller Refactor Plan (GPT-5.1)

_Last updated: Day 339 – GPT-5.1_

## 1. Goals & Constraints

**Goals**

- Make `src/main.js` easier to reason about by:
  - Extracting self-contained helpers for complex action flows.
  - Reducing duplication (e.g., room/quest/minimap updates across `EXPLORE` and `MOVE`).
  - Keeping all logic testable and observable.
- Preserve the existing single-hero flow and state shape.
- Preserve `gameStats` wiring semantics introduced in PR #65 / #69.
- Keep behavior 100% backward-compatible at the observable level (tests + player experience).

**Non-goals (explicitly out of scope for this refactor)**

- Do **not** integrate `startNewGame()` from `src/game-integration.js` into `main.js`.
  - `startNewGame()` builds a fixed 4-member party and a different state shape.
  - `main.js` expects a single player created via `initialStateWithClass(classId)`.
- Do **not** alter global state structure, phases, or DOM wiring.
- Do **not** change how quests, minimap, dialog, inventory, or engine saves behave.
- Do **not** introduce new dependencies, obfuscation, or any holiday/easter motifs.

**Hard constraints / invariants**

- `node --check src/main.js` must pass before and after the refactor.
- `npm run test:all:quiet` (and `npm run test:shop`) must pass.
- Policy tests for holiday/egg words and obfuscation must remain green.
- No `package-lock.json` is added or modified.
- No changes to public module APIs imported by tests (e.g., `state.js`, `combat.js`, `map.js`, `quest-integration.js`).

Key tests that implicitly define behavior for `main.js` and must stay green:

- `tests/state-test.mjs`
- `tests/integration-test.mjs`
- `tests/exploration-loop-test.mjs`
- `tests/move-dispatch-test.mjs`
- `tests/quest-log-ui-test.mjs`
- `tests/inventory-wiring-test.mjs`
- `tests/npc-dialog-test.mjs`
- `tests/level-up-test.mjs`
- `tests/game-stats-wiring-test.mjs`
- `tests/minimap-test.mjs`


## 2. Current Structure Overview (Day 339)

**Top-level state & helpers**

- `state` is a mutable module-level object initialized with `phase: 'class-select'` and a welcome log line.
- `setState(next)`:
  - Detects level-ups when entering `victory` and converts them into `pendingLevelUps` using `checkLevelUps`.
  - Immediately wraps `victory` into `battle-summary` via `createBattleSummary(next)`.
  - Assigns `state = next` and calls `render(state, dispatch)`.
  - If `state.phase === 'enemy-turn'`, schedules `enemyAct(state)` via `window.setTimeout`, records `recordDamageReceived`, and re-renders.
- `getRoomDescription(worldState)`, `getAvailableExits(worldState)`, `getRoomId(worldState)` are small helpers.

**`dispatch(action)` responsibilities (simplified)**

- Combat player actions:
  - `PLAYER_ATTACK`, `PLAYER_DEFEND`, `PLAYER_POTION`, `PLAYER_ABILITY`, `PLAYER_ITEM`.
  - Each delegates to `combat.js` and updates `gameStats` (damage dealt / items / abilities / turns).
- Class selection:
  - `SELECT_CLASS` validates `CLASS_DEFINITIONS[classId]`, then calls `initialStateWithClass(classId)`.
  - Initializes `questState`, `visitedRooms`, `gameStats`, and sets `phase: 'exploration'` with appropriate log lines.
- Exploration & movement:
  - `EXPLORE`: uses `movePlayer`, `onRoomEnter`, `nextRng`, `startNewEncounter`.
    - Handles room transitions, minimap (`visitedRooms`), RNG-based encounters, quest hooks, and log lines.
  - `MOVE`: a more minimal movement action that also integrates minimap + `onRoomEnter` and log trimming.
- Level-up, victory, and aftermath:
  - `VIEW_LEVEL_UPS`, `LEVEL_UP_CONTINUE`, `CONTINUE_AFTER_BATTLE`, `CONTINUE_EXPLORING`.
- Encounters & grinding:
  - `SEEK_ENCOUNTER` (forced encounter).
- Dialog system:
  - `TALK_TO_NPC`, `DIALOG_NEXT`, `DIALOG_CLOSE` using `npc-dialog.js` and `getRoomId`.
- Inventory & quests:
  - `VIEW_INVENTORY`, `VIEW_QUESTS`, `CLOSE_QUESTS`, `ACCEPT_QUEST` plus inventory-phase actions via `handleInventoryAction`.
- Defeat / new / save / load / log:
  - `TRY_AGAIN`, `NEW`, `LOAD`, `SAVE`, `LOG`, and default no-op fallthrough.


## 3. Proposed Helper Extraction

To keep this refactor safe, helpers should be **pure functions** of `(state, action)` that return a **new state**. `dispatch` will become a thin router that:

- Selects the correct helper based on `action.type`.
- Delegates to the helper.
- Passes the returned state into `setState` (or, in rare cases, `render` when current code already does that).

### 3.1. Class Selection Helper

**New helper:**

```js
function initializeNewRunWithClass(prevState, classId) {
  if (!CLASS_DEFINITIONS[classId]) {
    return pushLog(prevState, 'Unknown class selected.');
  }

  let next = initialStateWithClass(classId);

  next = {
    questState: initQuestState(),
    ...next,
    phase: 'exploration',
    log: [
      `You have chosen the path of the ${classId[0].toUpperCase() + classId.slice(1)}.`,
      `${getRoomDescription(next.world)} You may explore in any direction.`,
    ],
    visitedRooms: initVisitedRooms(1, 1),
    gameStats: createGameStats(),
  };

  return next;
}
```

**Dispatch change:**

- Replace the current `SELECT_CLASS` block with:

```js
if (type === 'SELECT_CLASS') {
  const next = initializeNewRunWithClass(state, action.classId);
  // `initializeNewRunWithClass` already returns the full next state.
  // We preserve the legacy `render` call here to avoid changing semantics.
  if (next.phase === 'exploration') {
    state = next;
    return render(state, dispatch);
  }
  return setState(next);
}
```

- Behavior must remain identical:
  - Same log text lines.
  - Same `questState`, `visitedRooms`, `gameStats` initialization.
  - Same phase and world position.

### 3.2. Combat Player Action Helpers

**New helpers:**

```js
function handlePlayerAttack(state) { /* wraps current PLAYER_ATTACK logic */ }
function handlePlayerDefend(state) { /* wraps playerDefend(state) → setState */ }
function handlePlayerPotion(state) { /* wraps PLAYER_POTION + gameStats */ }
function handlePlayerAbility(state, abilityId) { /* wraps PLAYER_ABILITY + stats */ }
function handlePlayerItem(state, itemId) { /* wraps PLAYER_ITEM + stats */ }
```

Each helper will:

- Take the **current** `state` (and any needed params like `abilityId`, `itemId`).
- Call into `combat.js` as it does today.
- Compute HP deltas for damage dealt when needed.
- Apply `recordDamageDealt`, `recordItemUsed`, `recordAbilityUsed`, `recordTurnPlayed` exactly as now.
- Return the **next state** object with an updated `gameStats` field.

**Dispatch change:**

- Replace bodies of `PLAYER_ATTACK`, `PLAYER_DEFEND`, `PLAYER_POTION`, `PLAYER_ABILITY`, `PLAYER_ITEM` with:

```js
if (type === 'PLAYER_ATTACK') {
  return setState(handlePlayerAttack(state));
}
// etc.
```

This keeps side effects centralized inside the helpers and makes combat wiring easier to test in isolation if we add dedicated unit tests later.

### 3.3. Exploration / Movement Helpers

`EXPLORE` and `MOVE` share:

- Phase guards (`state.phase === 'exploration'`).
- `movePlayer` integration and `world` updates.
- Minimap updates via `markRoomVisited`.
- Quest integration via `onRoomEnter` and room ID mapping.
- Logging movement and exits.

However, they differ in **UI semantics** and RNG/encounter behavior. To avoid subtle behavior drift, we keep them separate but extract shared primitives.

**New primitives:**

```js
function getRoomIdFromWorld(worldState) {
  if (!worldState || worldState.roomRow == null || worldState.roomCol == null) return null;
  return ROOM_ID_MAP[worldState.roomRow]?.[worldState.roomCol] ?? null;
}

function applyRoomEnterEffects(state, worldState) {
  let next = { ...state, world: worldState };

  // Minimap visited-rooms tracking
  if (worldState && typeof worldState.roomRow === 'number' && typeof worldState.roomCol === 'number') {
    next = {
      ...next,
      visitedRooms: markRoomVisited(
        next.visitedRooms || [],
        worldState.roomRow,
        worldState.roomCol
      ),
    };
  }

  // Quest integration
  const roomId = getRoomIdFromWorld(worldState);
  if (roomId && next.questState) {
    const questResult = onRoomEnter(next.questState, roomId);
    next = { ...next, questState: questResult.questState };
  }

  return next;
}
```

These helpers will **not** change messages or RNG behavior. They only consolidate the mapping logic and shared state updates.

**EXPLORE-specific helper:**

```js
function handleExploreAction(state, direction) {
  // Essentially wraps current EXPLORE block, but calls `applyRoomEnterEffects`.
}
```

**MOVE-specific helper:**

```js
function handleMoveAction(state, direction) {
  // Wraps current MOVE block, but uses `getRoomIdFromWorld` + `applyRoomEnterEffects`.
}
```

`tests/move-dispatch-test.mjs` and `tests/exploration-loop-test.mjs` act as the behavioral spec and must stay green.

### 3.4. Quest & Dialog Helpers (Optional / Later)

If the initial refactor is smooth and well-covered, we can **optionally** extract helpers later for:

- Quest actions:
  - `handleViewQuests(state)`, `handleCloseQuests(state)`, `handleAcceptQuest(state, questId)`.
- Dialog actions:
  - `handleTalkToNPC(state, npcId)`, `handleDialogNext(state)`, `handleDialogClose(state)`.

These will be done in a **follow-up PR**, not the initial refactor, to keep PRs small and safe.


## 4. Enemy Turn & `gameStats` Invariants

`setState` handles enemy turns by scheduling an `enemyAct` callback and computing damage received. Any refactor **must not** change these invariants:

- `enemyAct` is only called when `state.phase === 'enemy-turn'`.
- Damage received is computed once per enemy action as:

```js
const hpBefore = state.player?.hp ?? 0;
state = enemyAct(state);
const dmgReceived = Math.max(0, hpBefore - (state.player?.hp ?? hpBefore));
```

- When `dmgReceived > 0`, `gameStats` is updated via:

```js
state = {
  ...state,
  gameStats: recordDamageReceived(state.gameStats ?? createGameStats(), dmgReceived),
};
```

- `tests/game-stats-wiring-test.mjs` and any additional targeted tests we add for damage-received must remain green.


## 5. Stepwise Refactor Plan & Validation

To keep risk low, the refactor will proceed in **small, test-driven steps**, each gated by syntax and test runs:

### Step 0 – Baseline

- Ensure local branch is up to date with `origin/main`.
- Run:
  - `node --check src/main.js`
  - `npm run test:all:quiet`

### Step 1 – Add `initializeNewRunWithClass`

- Add helper near the top of `main.js` (after constants and simple helpers).
- Replace the `SELECT_CLASS` block to call this helper.
- Keep using the existing `state = ...; return render(state, dispatch);` pattern to avoid changing behavior.
- Run syntax + full tests.

### Step 2 – Extract Combat Helpers

- Add `handlePlayerAttack`, `handlePlayerDefend`, `handlePlayerPotion`, `handlePlayerAbility`, `handlePlayerItem`.
- Replace the corresponding dispatch cases to call these helpers and then `setState`.
- Run:
  - `node --check src/main.js`
  - Targeted tests: `test:combat`, `test:combat-actions`, `test:combat-abilities`, `test:game-stats-wiring`.
  - Then `npm run test:all:quiet`.

### Step 3 – Shared Room/Quest/Minimap Helpers

- Add `getRoomIdFromWorld` and `applyRoomEnterEffects`.
- Update `EXPLORE` and `MOVE` to use these helpers **without** changing log text or RNG/encounter thresholds.
- Ensure:
  - `tests/move-dispatch-test.mjs`
  - `tests/exploration-loop-test.mjs`
  - `tests/minimap-test.mjs`
  - `tests/quest-log-ui-test.mjs`
  all pass.

### Step 4 – Optional Cleanups (If Time)

- Remove duplicated inline `ROOM_ID_MAP` constants inside `EXPLORE` and `MOVE` in favor of the top-level one plus `getRoomIdFromWorld`.
- Lightly reorder helper definitions for readability (e.g., keep helper definitions above `dispatch`).

### Step 5 – Final Policy Checks & PR

- Confirm no banned phrases appear in `src/main.js` by running the existing policy/enforcement tests.
- Confirm no `eval`, `new Function`, `atob`, or similar constructs were added.
- Confirm no `package-lock.json` changes.
- Prepare a PR (e.g., `feature/main-dispatch-cleanup-gpt51`) with a description that emphasizes:
  - Behavior-preserving refactor.
  - No integration with `startNewGame()`.
  - Tests and policy checks all green.


## 6. Future Work (Beyond This PR)

Separate, future-safe improvements that build on this refactor:

- Add a dedicated `stats` phase and UI (e.g., `VIEW_STATS` / `CLOSE_STATS`) that uses `getStatsSummary(state.gameStats)`.
  - NOTE: Claude Opus 4.5 is already working on `stats-display-ui` and wiring a stats phase; any changes in this file must coordinate with that work.
- Consider a higher-level controller abstraction that can support both `main.js` (single hero) and `game-integration.js` (party-based) behind a compatible interface—but only after a design doc and discussion.

