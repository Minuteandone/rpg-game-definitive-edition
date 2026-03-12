/**
 * Tests for sporeling-evolution-ui.js
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  renderSporelingEvolutionPanel,
  getSporelingEvolutionStyles,
} from '../src/sporeling-evolution-ui.js';

import {
  recruitSporelingCompanion,
  awardSporelingCombatPoints,
  evolveSporelingCompanion,
} from '../src/sporeling-integration.js';

describe('sporeling-evolution-ui', () => {
  let baseState;

  beforeEach(() => {
    baseState = {
      companions: [],
      maxCompanions: 3,
      log: [],
    };
  });

  describe('renderSporelingEvolutionPanel', () => {
    it('renders empty state when no sporeling', () => {
      const html = renderSporelingEvolutionPanel(baseState);
      assert.ok(html.includes('sporeling-empty'));
      assert.ok(html.includes("don't have a sporeling"));
    });

    it('renders sporeling info when present', () => {
      const state = recruitSporelingCompanion(baseState, 'TestSpore');
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(html.includes('TestSpore'));
      assert.ok(html.includes('sporeling-evolution-panel'));
      assert.ok(!html.includes('sporeling-empty'));
    });

    it('includes HP bar', () => {
      const state = recruitSporelingCompanion(baseState, 'HPTest');
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(html.includes('sporeling-bar-hp'));
      assert.ok(html.includes('HP'));
    });

    it('includes evolution bar', () => {
      const state = recruitSporelingCompanion(baseState, 'EvoTest');
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(html.includes('sporeling-bar-evolution'));
      assert.ok(html.includes('Evolution'));
    });

    it('includes combat stats', () => {
      const state = recruitSporelingCompanion(baseState, 'StatsTest');
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(html.includes('ATK:'));
      assert.ok(html.includes('DEF:'));
      assert.ok(html.includes('SPD:'));
    });

    it('includes stage progress display', () => {
      const state = recruitSporelingCompanion(baseState, 'StageTest');
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(html.includes('stage-marker'));
      assert.ok(html.includes('Cell'));
    });

    it('shows no traits for new sporeling', () => {
      const state = recruitSporelingCompanion(baseState, 'NewSpore');
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(html.includes('No traits acquired yet'));
    });

    it('shows dismiss button', () => {
      const state = recruitSporelingCompanion(baseState, 'DismissTest');
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(html.includes('data-action="DISMISS_SPORELING"'));
      assert.ok(html.includes('Release Sporeling'));
    });

    it('shows evolution choices when can evolve', () => {
      let state = recruitSporelingCompanion(baseState, 'EvolveReady');
      
      // Award enough points to be ready for evolution
      for (let i = 0; i < 10; i++) {
        state = awardSporelingCombatPoints(state, 50);
      }
      
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(html.includes('sporeling-evolution-choices'));
      assert.ok(html.includes('Choose a Trait'));
      assert.ok(html.includes('sporeling-evolve-ready'));
    });

    it('does not show evolution choices when not ready', () => {
      const state = recruitSporelingCompanion(baseState, 'NotReady');
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(!html.includes('sporeling-evolution-choices'));
      assert.ok(!html.includes('sporeling-evolve-ready'));
    });

    it('shows trait options with evolve buttons', () => {
      let state = recruitSporelingCompanion(baseState, 'TraitTest');
      
      for (let i = 0; i < 10; i++) {
        state = awardSporelingCombatPoints(state, 50);
      }
      
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(html.includes('data-action="EVOLVE_SPORELING"'));
      assert.ok(html.includes('data-trait-id'));
    });

    it('displays stage icon', () => {
      const state = recruitSporelingCompanion(baseState, 'IconTest');
      const html = renderSporelingEvolutionPanel(state);
      
      // Cell stage icon
      assert.ok(html.includes('🦠'));
    });

    it('escapes HTML in sporeling name', () => {
      const state = recruitSporelingCompanion(baseState, '<script>alert("xss")</script>');
      const html = renderSporelingEvolutionPanel(state);
      
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });

  describe('getSporelingEvolutionStyles', () => {
    it('returns CSS string', () => {
      const styles = getSporelingEvolutionStyles();
      assert.strictEqual(typeof styles, 'string');
    });

    it('includes panel styles', () => {
      const styles = getSporelingEvolutionStyles();
      assert.ok(styles.includes('.sporeling-evolution-panel'));
    });

    it('includes bar styles', () => {
      const styles = getSporelingEvolutionStyles();
      assert.ok(styles.includes('.sporeling-bar'));
      assert.ok(styles.includes('.sporeling-bar-hp'));
      assert.ok(styles.includes('.sporeling-bar-evolution'));
    });

    it('includes button styles', () => {
      const styles = getSporelingEvolutionStyles();
      assert.ok(styles.includes('.sporeling-button'));
    });

    it('includes animation keyframes', () => {
      const styles = getSporelingEvolutionStyles();
      assert.ok(styles.includes('@keyframes pulse'));
    });

    it('includes stage progress styles', () => {
      const styles = getSporelingEvolutionStyles();
      assert.ok(styles.includes('.stage-marker'));
      assert.ok(styles.includes('.stage-current'));
    });

    it('includes trait styles', () => {
      const styles = getSporelingEvolutionStyles();
      assert.ok(styles.includes('.sporeling-trait-badge'));
      assert.ok(styles.includes('.sporeling-trait-option'));
    });
  });
});
