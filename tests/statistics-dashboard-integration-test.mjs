/**
 * Tests for Statistics Dashboard Integration
 * Ensures the dashboard integrates properly with the game menu system
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  renderStatsDashboardPhase,
  renderStatsDashboardActions,
  attachStatsDashboardHandlers,
  initStatsDashboard,
  isStatsDashboardOpen,
  getStatsDashboardIntegrationStyles
} from '../src/statistics-dashboard-integration.js';
import { createEmptyStatistics } from '../src/statistics-dashboard.js';

function createMockDocument() {
  const elementsById = new Map();
  const headChildren = [];

  const doc = {
    head: {
      appendChild: (el) => {
        headChildren.push(el);
        if (el && el.id) {
          elementsById.set(el.id, el);
        }
      },
    },
    body: {},
    createElement: (tagName) => ({
      tagName,
      id: '',
      textContent: '',
    }),
    getElementById: (id) => elementsById.get(id) || null,
    querySelectorAll: (selector) => {
      // Minimal support for '#stats-dashboard-integration-styles'
      if (typeof selector === 'string' && selector.startsWith('#')) {
        const id = selector.slice(1);
        const el = elementsById.get(id);
        return el ? [el] : [];
      }
      return [];
    },
    querySelector: (selector) => {
      // Minimal support for '#btnCloseStatsDashboard'
      if (selector === '#btnCloseStatsDashboard') {
        return elementsById.get('btnCloseStatsDashboard') || null;
      }
      return null;
    },
    __setElement: (id, el) => {
      elementsById.set(id, el);
      return el;
    },
    __getHeadChildren: () => headChildren.slice(),
  };

  return doc;
}

describe('Statistics Dashboard Integration', () => {
  let document;

  beforeEach(() => {
    document = createMockDocument();
    global.document = document;
  });

  describe('getStatsDashboardIntegrationStyles', () => {
    it('should return CSS string', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.strictEqual(typeof styles, 'string');
      assert.ok(styles.length > 0);
    });

    it('should include container styles', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.ok(styles.includes('.stats-dashboard-container'));
    });

    it('should include close button styles', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.ok(styles.includes('.stats-dashboard-close-btn'));
    });

    it('should include actions styles', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.ok(styles.includes('.stats-dashboard-actions'));
    });

    it('should include hover styles', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.ok(styles.includes(':hover'));
    });
  });

  describe('renderStatsDashboardPhase', () => {
    it('should render dashboard container', () => {
      const state = { statistics: createEmptyStatistics() };
      const html = renderStatsDashboardPhase(state);
      assert.ok(html.includes('stats-dashboard-container'));
    });

    it('should render with empty state', () => {
      const state = {};
      const html = renderStatsDashboardPhase(state);
      assert.strictEqual(typeof html, 'string');
      assert.ok(html.length > 0);
    });

    it('should include dashboard content', () => {
      const state = { statistics: createEmptyStatistics() };
      const html = renderStatsDashboardPhase(state);
      assert.ok(html.includes('stats-dashboard'));
    });
  });

  describe('renderStatsDashboardActions', () => {
    it('should render close button', () => {
      const html = renderStatsDashboardActions();
      assert.ok(html.includes('btnCloseStatsDashboard'));
    });

    it('should include buttons class', () => {
      const html = renderStatsDashboardActions();
      assert.ok(html.includes('buttons'));
    });

    it('should include close text', () => {
      const html = renderStatsDashboardActions();
      assert.ok(html.includes('Close Statistics'));
    });

    it('should include chart emoji', () => {
      const html = renderStatsDashboardActions();
      assert.ok(html.includes('📊'));
    });
  });

  describe('attachStatsDashboardHandlers', () => {
    it('should attach close button handler', () => {
      const closeBtn = {
        onclick: null,
        click() {
          if (typeof this.onclick === 'function') this.onclick();
        },
      };
      document.__setElement('btnCloseStatsDashboard', closeBtn);

      let dispatched = null;
      const dispatch = (action) => { dispatched = action; };

      attachStatsDashboardHandlers(document, dispatch);
      closeBtn.click();

      assert.deepStrictEqual(dispatched, { type: 'CLOSE_STATISTICS_DASHBOARD' });
    });

    it('should handle missing button gracefully', () => {
      const dispatch = () => {};
      // Should not throw
      attachStatsDashboardHandlers(document, dispatch);
    });
  });

  describe('initStatsDashboard', () => {
    it('should inject integration styles', () => {
      initStatsDashboard(document);
      const styleEl = document.getElementById('stats-dashboard-integration-styles');
      assert.ok(styleEl);
    });

    it('should not duplicate styles on multiple calls', () => {
      initStatsDashboard(document);
      initStatsDashboard(document);
      const styleEls = document.querySelectorAll('#stats-dashboard-integration-styles');
      assert.strictEqual(styleEls.length, 1);
    });

    it('should inject dashboard UI styles', () => {
      initStatsDashboard(document);
      const styleEl = document.getElementById('stats-dashboard-integration-styles');
      assert.ok(styleEl);
    });
  });

  describe('isStatsDashboardOpen', () => {
    it('should return true when phase is statistics-dashboard', () => {
      const state = { phase: 'statistics-dashboard' };
      assert.strictEqual(isStatsDashboardOpen(state), true);
    });

    it('should return false for other phases', () => {
      assert.strictEqual(isStatsDashboardOpen({ phase: 'exploration' }), false);
      assert.strictEqual(isStatsDashboardOpen({ phase: 'combat' }), false);
      assert.strictEqual(isStatsDashboardOpen({ phase: 'stats' }), false);
    });

    it('should return false for undefined phase', () => {
      assert.strictEqual(isStatsDashboardOpen({}), false);
    });
  });
});

describe('UI Handler Integration', () => {

  it('battle continuation should populate statistics dashboard combat and economy totals', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');
    const state = {
      phase: 'battle-summary',
      previousPhase: 'exploration',
      player: { hp: 30, maxHp: 30, defending: false },
      enemy: { name: 'Grumpy Slime', isBoss: false },
      world: { currentRow: 1, currentCol: 1, roomRow: 1, roomCol: 1 },
      battleSummary: {},
      log: [],
      goldGained: 7,
      xpGained: 12,
    };

    const result = handleUIAction(state, { type: 'CONTINUE_AFTER_BATTLE' });

    assert.strictEqual(result.statistics.enemies.totalDefeated, 1);
    assert.strictEqual(result.statistics.enemies.defeatedByType['Grumpy Slime'], 1);
    assert.strictEqual(result.statistics.economy.goldEarned, 7);
    assert.strictEqual(result.statistics.economy.goldFromCombat, 7);
  });

  it('inn and shop actions should update statistics dashboard economy counters', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');

    const innState = {
      phase: 'dialog',
      player: { gold: 25, hp: 10, maxHp: 30, mp: 2, maxMp: 12 },
      log: [],
    };
    const innResult = handleUIAction(innState, { type: 'INN_REST' });
    assert.strictEqual(innResult.statistics.economy.goldSpent, 20);
    assert.strictEqual(innResult.statistics.economy.goldSpentOnServices, 20);
    assert.ok(innResult.statistics.combat.totalHealingReceived > 0);

    const shopState = {
      phase: 'shop',
      player: { gold: 100, inventory: { potion: 1 } },
      shopState: {
        npcId: 'merchant_bram',
        stock: [{ itemId: 'potion', quantity: 10 }],
        tab: 'buy',
        previousPhase: 'exploration',
      },
    };
    const buyResult = handleUIAction(shopState, { type: 'BUY_ITEM', itemId: 'potion' });
    assert.ok(buyResult.statistics.economy.goldSpent > 0);
    assert.ok(buyResult.statistics.economy.goldSpentOnItems > 0);

    const sellResult = handleUIAction({
      ...buyResult,
      phase: 'shop',
      shopState: { ...buyResult.shopState, tab: 'sell' },
    }, { type: 'SELL_ITEM', itemId: 'potion' });
    assert.ok(sellResult.statistics.economy.goldEarned > 0);
    assert.ok(sellResult.statistics.economy.goldFromSelling > 0);
  });
  it('should handle OPEN_STATISTICS_DASHBOARD action', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');
    const state = { phase: 'exploration' };
    const result = handleUIAction(state, { type: 'OPEN_STATISTICS_DASHBOARD' });

    assert.strictEqual(result.phase, 'statistics-dashboard');
    assert.strictEqual(result.previousPhase, 'exploration');
  });

  it('should handle CLOSE_STATISTICS_DASHBOARD action', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');
    const state = { phase: 'statistics-dashboard', previousPhase: 'exploration' };
    const result = handleUIAction(state, { type: 'CLOSE_STATISTICS_DASHBOARD' });

    assert.strictEqual(result.phase, 'exploration');
  });

  it('should return null for CLOSE when not in dashboard phase', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');
    const state = { phase: 'exploration' };
    const result = handleUIAction(state, { type: 'CLOSE_STATISTICS_DASHBOARD' });

    assert.strictEqual(result, null);
  });

  it('should default to exploration when no previousPhase', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');
    const state = { phase: 'statistics-dashboard' };
    const result = handleUIAction(state, { type: 'CLOSE_STATISTICS_DASHBOARD' });

    assert.strictEqual(result.phase, 'exploration');
  });
});

describe('Render Integration', () => {
  it('should have button in exploration menu HTML', async () => {
    // This test verifies the button was added to render.js
    const fs = await import('fs');
    const renderContent = fs.readFileSync('./src/render.js', 'utf8');

    assert.ok(renderContent.includes('btnStatsDashboard'));
    assert.ok(renderContent.includes('OPEN_STATISTICS_DASHBOARD'));
  });

  it('should have statistics-dashboard phase handling', async () => {
    const fs = await import('fs');
    const renderContent = fs.readFileSync('./src/render.js', 'utf8');

    assert.ok(renderContent.includes("phase === 'statistics-dashboard'"));
    assert.ok(renderContent.includes('renderStatsDashboardPhase'));
  });
});
