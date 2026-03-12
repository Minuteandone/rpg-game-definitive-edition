/**
 * sporeling-evolution-ui.js — UI panel for sporeling evolution system
 *
 * Displays:
 * - Sporeling status (name, stage, HP)
 * - Evolution progress bar
 * - Available traits for evolution
 * - Evolution action button
 */

import {
  getSporelingStatus,
  getAvailableEvolutionTraits,
  hasSporeling,
  EVOLUTION_STAGES,
} from './sporeling-integration.js';

const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getBarPercent = (current, max) => {
  const safeMax = max > 0 ? max : 1;
  return Math.round((clamp(current, 0, safeMax) / safeMax) * 100);
};

const STAGE_ICONS = {
  CELL: '🦠',
  CREATURE: '🦎',
  TRIBAL: '🏕️',
  CIVILIZED: '🏛️',
  COSMIC: '🌌',
};

const renderHpBar = (current, max) => {
  const percent = getBarPercent(current, max);
  return `
    <div class="sporeling-bar sporeling-bar-hp">
      <div class="sporeling-bar-fill" style="width: ${percent}%"></div>
      <span class="sporeling-bar-label">HP ${current}/${max}</span>
    </div>
  `;
};

const renderEvolutionBar = (current, needed, percent) => {
  return `
    <div class="sporeling-bar sporeling-bar-evolution">
      <div class="sporeling-bar-fill" style="width: ${percent}%"></div>
      <span class="sporeling-bar-label">Evolution ${current} pts (${needed} to next)</span>
    </div>
  `;
};

const renderTraitBadge = (trait) => {
  const categoryColors = {
    offense: '#e74c3c',
    defense: '#3498db',
    utility: '#9b59b6',
  };
  const color = categoryColors[trait.category] || '#7f8c8d';
  return `
    <div class="sporeling-trait-badge" style="border-color: ${color}">
      <span class="trait-name">${escapeHtml(trait.name)}</span>
      <span class="trait-category">${escapeHtml(trait.category)}</span>
    </div>
  `;
};

const renderTraitOption = (trait) => {
  const categoryColors = {
    offense: '#e74c3c',
    defense: '#3498db',
    utility: '#9b59b6',
  };
  const color = categoryColors[trait.category] || '#7f8c8d';
  return `
    <div class="sporeling-trait-option" data-trait-id="${escapeHtml(trait.id)}" style="border-left: 3px solid ${color}">
      <div class="trait-header">
        <span class="trait-name">${escapeHtml(trait.name)}</span>
        <span class="trait-category">(${escapeHtml(trait.category)})</span>
      </div>
      <div class="trait-description">${escapeHtml(trait.description)}</div>
      <button class="sporeling-button sporeling-button-evolve" data-action="EVOLVE_SPORELING" data-trait-id="${escapeHtml(trait.id)}">
        Select Trait
      </button>
    </div>
  `;
};

const renderStageProgress = (currentStage) => {
  const stages = Object.keys(EVOLUTION_STAGES);
  const currentIndex = stages.indexOf(currentStage);

  return stages.map((stage, index) => {
    const icon = STAGE_ICONS[stage] || '?';
    const info = EVOLUTION_STAGES[stage];
    const isComplete = index < currentIndex;
    const isCurrent = index === currentIndex;
    const classes = ['stage-marker'];
    if (isComplete) classes.push('stage-complete');
    if (isCurrent) classes.push('stage-current');

    return `
      <div class="${classes.join(' ')}" title="${escapeHtml(info.name)}: ${escapeHtml(info.description)}">
        <span class="stage-icon">${icon}</span>
        <span class="stage-name">${escapeHtml(info.name)}</span>
      </div>
    `;
  }).join('<div class="stage-connector"></div>');
};

export function renderSporelingEvolutionPanel(state) {
  if (!hasSporeling(state)) {
    return `
      <section class="sporeling-evolution-panel sporeling-empty">
        <header class="sporeling-panel-header">
          <h3>Sporeling Companion</h3>
        </header>
        <div class="sporeling-empty-message">
          <p>You don't have a sporeling companion yet.</p>
          <p>Find one in the wild to recruit!</p>
        </div>
      </section>
    `;
  }

  const status = getSporelingStatus(state);
  const availableTraits = getAvailableEvolutionTraits(state);
  const stageIcon = STAGE_ICONS[status.stage?.toUpperCase()] || '🦠';

  const acquiredTraitsHtml = status.traits.length > 0
    ? status.traits.map(traitId => {
        const trait = availableTraits.find(t => t.id === traitId) || { name: traitId, category: 'unknown' };
        return renderTraitBadge(trait);
      }).join('')
    : '<span class="no-traits">No traits acquired yet</span>';

  const evolutionChoicesHtml = status.canEvolve
    ? `
      <div class="sporeling-evolution-choices">
        <h4>Choose a Trait to Evolve</h4>
        <div class="sporeling-trait-list">
          ${availableTraits.slice(0, 3).map(trait => renderTraitOption(trait)).join('')}
        </div>
      </div>
    `
    : '';

  return `
    <section class="sporeling-evolution-panel">
      <header class="sporeling-panel-header">
        <h3>${stageIcon} ${escapeHtml(status.name)}</h3>
        <span class="sporeling-stage">${escapeHtml(status.stage)} Stage</span>
      </header>

      <div class="sporeling-stage-progress">
        ${renderStageProgress(status.stage?.toUpperCase() || 'CELL')}
      </div>

      <div class="sporeling-stats">
        ${renderHpBar(status.hp ?? 0, status.maxHp ?? 0)}
        ${renderEvolutionBar(status.evolutionPoints, status.pointsToNextStage, status.progressPercent)}
      </div>

      <div class="sporeling-combat-stats">
        <span class="stat-item">ATK: ${status.stats?.attack ?? 0}</span>
        <span class="stat-item">DEF: ${status.stats?.defense ?? 0}</span>
        <span class="stat-item">SPD: ${status.stats?.speed ?? 0}</span>
      </div>

      <div class="sporeling-traits">
        <h4>Acquired Traits</h4>
        <div class="sporeling-trait-badges">
          ${acquiredTraitsHtml}
        </div>
      </div>

      ${evolutionChoicesHtml}

      ${status.canEvolve ? '<div class="sporeling-evolve-ready">Ready to evolve!</div>' : ''}

      <div class="sporeling-actions">
        <button class="sporeling-button" data-action="DISMISS_SPORELING">Release Sporeling</button>
      </div>
    </section>
  `;
}

export function getSporelingEvolutionStyles() {
  return `
    .sporeling-evolution-panel {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      color: #e0e0e0;
      font-family: system-ui, sans-serif;
    }

    .sporeling-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
    }

    .sporeling-panel-header h3 {
      margin: 0;
      font-size: 18px;
      color: #9b59b6;
    }

    .sporeling-stage {
      background: rgba(155, 89, 182, 0.2);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .sporeling-stage-progress {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 12px 0;
      padding: 8px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    }

    .stage-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      opacity: 0.4;
      transition: opacity 0.2s;
    }

    .stage-marker.stage-complete,
    .stage-marker.stage-current {
      opacity: 1;
    }

    .stage-marker.stage-current {
      transform: scale(1.1);
    }

    .stage-icon {
      font-size: 20px;
    }

    .stage-name {
      font-size: 10px;
      margin-top: 2px;
    }

    .stage-connector {
      flex: 1;
      height: 2px;
      background: rgba(255, 255, 255, 0.2);
      margin: 0 4px;
    }

    .sporeling-bar {
      height: 20px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      position: relative;
      margin: 8px 0;
      overflow: hidden;
    }

    .sporeling-bar-fill {
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
    }

    .sporeling-bar-hp .sporeling-bar-fill {
      background: linear-gradient(90deg, #27ae60, #2ecc71);
    }

    .sporeling-bar-evolution .sporeling-bar-fill {
      background: linear-gradient(90deg, #8e44ad, #9b59b6);
    }

    .sporeling-bar-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 11px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .sporeling-combat-stats {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin: 12px 0;
      font-size: 13px;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 4px 10px;
      border-radius: 4px;
    }

    .sporeling-traits h4 {
      margin: 12px 0 8px;
      font-size: 14px;
      color: #bdc3c7;
    }

    .sporeling-trait-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .sporeling-trait-badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 12px;
    }

    .no-traits {
      color: #7f8c8d;
      font-style: italic;
      font-size: 12px;
    }

    .sporeling-evolution-choices {
      margin: 16px 0;
      padding: 12px;
      background: rgba(155, 89, 182, 0.1);
      border: 1px solid rgba(155, 89, 182, 0.3);
      border-radius: 8px;
    }

    .sporeling-evolution-choices h4 {
      margin: 0 0 12px;
      color: #9b59b6;
    }

    .sporeling-trait-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sporeling-trait-option {
      background: rgba(0, 0, 0, 0.2);
      padding: 10px;
      border-radius: 6px;
    }

    .trait-header {
      display: flex;
      gap: 8px;
      margin-bottom: 4px;
    }

    .trait-name {
      font-weight: bold;
    }

    .trait-category {
      color: #7f8c8d;
      font-size: 12px;
    }

    .trait-description {
      font-size: 12px;
      color: #bdc3c7;
      margin-bottom: 8px;
    }

    .sporeling-button {
      background: linear-gradient(135deg, #3498db, #2980b9);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: transform 0.1s, box-shadow 0.1s;
    }

    .sporeling-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(52, 152, 219, 0.4);
    }

    .sporeling-button-evolve {
      background: linear-gradient(135deg, #9b59b6, #8e44ad);
    }

    .sporeling-button-evolve:hover {
      box-shadow: 0 2px 8px rgba(155, 89, 182, 0.4);
    }

    .sporeling-evolve-ready {
      text-align: center;
      color: #f1c40f;
      font-weight: bold;
      animation: pulse 1.5s infinite;
      margin: 12px 0;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .sporeling-actions {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sporeling-empty {
      text-align: center;
      padding: 24px;
    }

    .sporeling-empty-message {
      color: #7f8c8d;
    }
  `;
}
