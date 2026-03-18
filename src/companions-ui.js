import {
  getAvailableCompanions,
  getCompanionBonuses,
} from './companions.js';
import { NPCS } from './data/npcs.js';
import { getCurrentRoomId, ROOM_NAMES } from './minimap.js';

// Map NPC building locations to their room-grid IDs
const LOCATION_TO_ROOM = {
  village_square: 'center',
  rusty_anchor_inn: 'center',
  blacksmith_shop: 'center',
  healer_hut: 'center',
  barracks: 'center',
  alchemy_shop: 'center',
  mage_tower: 'ne',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getBarPercent = (current, max) => {
  const safeMax = max > 0 ? max : 1;
  return Math.round((clamp(current, 0, safeMax) / safeMax) * 100);
};

const getClassIcon = (className) => {
  if (className === 'Warrior') return '⚔️';
  if (className === 'Mage') return '🔮';
  return '👤';
};

const formatStatus = (isAlive) => (isAlive ? 'Alive' : 'Fallen');
const formatLocationId = (id) => id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const renderHpBar = (current, max) => {
  const percent = getBarPercent(current, max);
  return `
    <div class="companion-bar companion-bar-hp">
      <div class="companion-bar-fill" style="width: ${percent}%"></div>
      <span class="companion-bar-label">HP ${percent}%</span>
    </div>
  `;
};

const renderLoyaltyBar = (current, max) => {
  const percent = getBarPercent(current, max);
  return `
    <div class="companion-bar companion-bar-loyalty">
      <div class="companion-bar-fill" style="width: ${percent}%"></div>
      <span class="companion-bar-label">Loyalty ${percent}%</span>
    </div>
  `;
};

const renderRecruitedCompanion = (companion) => {
  const {
    id,
    name,
    class: className,
    level,
    hp,
    maxHp,
    loyalty,
    alive,
  } = companion;

  return `
    <div class="companion-card companion-card-recruited" data-companion-id="${id}">
      <div class="companion-card-header">
        <div class="companion-name">${name}</div>
        <div class="companion-meta">${className} • Lv ${level}</div>
      </div>
      <div class="companion-status">
        ${renderHpBar(hp ?? 0, maxHp ?? 0)}
        ${renderLoyaltyBar(loyalty ?? 0, 100)}
        <div class="companion-life-state">${formatStatus(alive !== false)}</div>
      </div>
      <div class="companion-actions">
        <button class="companion-button" data-action="DISMISS_COMPANION" data-companion-id="${id}">Dismiss</button>
      </div>
    </div>
  `;
};

const renderAvailableCompanion = (npc, playerRoom) => {
  const stats = npc.stats || {};

  return `
    <div class="companion-card companion-card-available" data-companion-id="${npc.id}">
      <div class="companion-card-header">
        <div class="companion-name">${npc.name}</div>
        <div class="companion-meta">${stats.class} • Lv ${stats.level}</div>
      </div>
      <div class="companion-location">Location: ${npc.location ? formatLocationId(npc.location) : 'Unknown'}${(() => {
        const roomId = LOCATION_TO_ROOM[npc.location];
        const roomName = roomId ? ROOM_NAMES[roomId] : null;
        return roomName ? ` (${roomName})` : '';
      })()}</div>
      <div class="companion-actions">${(() => {
        const companionRoom = LOCATION_TO_ROOM[npc.location] || null;
        const isHere = !playerRoom || !companionRoom || playerRoom === companionRoom;
        if (isHere) {
          return `<button class="companion-button" data-action="RECRUIT_COMPANION" data-companion-id="${npc.id}">Recruit</button>`;
        } else {
          const roomName = ROOM_NAMES[companionRoom] || 'their location';
          return `<button class="companion-button" disabled title="Travel to ${roomName} to recruit">Not Here</button>`;
        }
      })()}</div>
    </div>
  `;
};

export const renderCompanionPanel = (state) => {
  const recruited = state?.companions || [];

  const availableNpcCompanions =
    getAvailableCompanions(state)
    || Object.values(NPCS || {}).filter((npc) => npc.type === 'COMPANION');

  const { attackBonus = 0, defenseBonus = 0 } = getCompanionBonuses(state) || {};

  return `
    <section class="companion-panel">
      <header class="companion-panel-header">
        <h2 class="companion-title">🤝 Companions</h2>
        <button class="companion-close" data-action="CLOSE_COMPANIONS">Close</button>
      </header>

      <div class="companion-section">
        <h3 class="companion-section-title">Current Party</h3>
        <div class="companion-list">
          ${
            recruited.length
              ? recruited.map(renderRecruitedCompanion).join('')
              : '<div class="companion-empty">No companions recruited yet.</div>'
          }
        </div>
      </div>

      <div class="companion-section">
        <h3 class="companion-section-title">Available Companions</h3>
        <div class="companion-list">
          ${
            availableNpcCompanions.length
              ? availableNpcCompanions.map((npc) => renderAvailableCompanion(npc, getCurrentRoomId(state?.world))).join('')
              : '<div class="companion-empty">No companions available right now.</div>'
          }
        </div>
      </div>

      <div class="companion-section companion-bonuses">
        <h3 class="companion-section-title">Party Bonuses</h3>
        <div class="companion-bonus">Attack Bonus: +${attackBonus}</div>
        <div class="companion-bonus">Defense Bonus: +${defenseBonus}</div>
      </div>
    </section>
`;
};

export const renderCompanionHUD = (state) => {
  const recruited = state?.companions || [];

  if (!recruited.length) return '';

  return `
    <div class="companion-hud">
      ${recruited
        .map((companion) => {
          const icon = getClassIcon(companion.class);
          const currentHp = companion.hp ?? 0;
          const maxHp = companion.maxHp ?? 0;
          const isAlive = companion.alive !== false;
          return `
            <div class="companion-hud-item" data-companion-id="${companion.id}">
              <span class="companion-hud-icon">${icon}</span>
              <span class="companion-hud-name">${companion.name}</span>
              <span class="companion-hud-hp">HP ${currentHp}/${maxHp}</span>
              <span class="companion-hud-status">${formatStatus(isAlive)}</span>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
};

export const renderCompanionBadge = (state) => {
  const recruited = state?.companions || [];

  if (!recruited.length) return '';

  const maxParty = state?.maxCompanions || 2;

  return `<span class="companion-badge">🤝 ${recruited.length}/${maxParty}</span>`;
};
