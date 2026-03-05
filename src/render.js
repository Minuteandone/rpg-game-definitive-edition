import { saveToLocalStorage } from './state.js';

function hpLine(entity) {
  const pct = Math.round((entity.hp / entity.maxHp) * 100);
  const status = entity.hp <= 0 ? 'bad' : (pct <= 25 ? 'bad' : (pct >= 75 ? 'good' : ''));
  return `<span class="${status}">${entity.hp}</span> / ${entity.maxHp}`;
}

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function render(state, dispatch) {
  const hud = document.getElementById('hud');
  const actions = document.getElementById('actions');
  const log = document.getElementById('log');

  hud.innerHTML = `
    <div class="row">
      <div class="card">
        <h2>Player</h2>
        <div class="kv">
          <div>HP</div><div><b>${hpLine(state.player)}</b></div>
          <div>ATK / DEF</div><div><b>${state.player.atk}</b> / <b>${state.player.def}</b></div>
          <div>Defending</div><div><b>${state.player.defending ? 'Yes' : 'No'}</b></div>
          <div>Potions</div><div><b>${state.player.inventory.potion ?? 0}</b></div>
        </div>
      </div>

      <div class="card">
        <h2>Enemy</h2>
        <div class="kv">
          <div>Name</div><div><b>${esc(state.enemy.name)}</b></div>
          <div>HP</div><div><b>${hpLine(state.enemy)}</b></div>
          <div>ATK / DEF</div><div><b>${state.enemy.atk}</b> / <b>${state.enemy.def}</b></div>
          <div>Defending</div><div><b>${state.enemy.defending ? 'Yes' : 'No'}</b></div>
        </div>
      </div>

      <div class="card">
        <h2>Game</h2>
        <div class="kv">
          <div>Phase</div><div><b>${esc(state.phase)}</b></div>
          <div>Turn</div><div><b>${state.turn}</b></div>
        </div>
      </div>
    </div>
  `;

  const isPlayerTurn = state.phase === 'player-turn';
  const isOver = state.phase === 'victory' || state.phase === 'defeat';

  actions.innerHTML = `
    <div class="buttons">
      <button id="btnAttack" ${(!isPlayerTurn || isOver) ? 'disabled' : ''}>Attack</button>
      <button id="btnDefend" ${(!isPlayerTurn || isOver) ? 'disabled' : ''}>Defend</button>
      <button id="btnPotion" ${(!isPlayerTurn || isOver) ? 'disabled' : ''}>Use Potion</button>
      <button id="btnSave">Save</button>
      <button id="btnLoad">Load</button>
      <button id="btnNew">New Game</button>
    </div>
  `;

  document.getElementById('btnAttack').onclick = () => dispatch({ type: 'PLAYER_ATTACK' });
  document.getElementById('btnDefend').onclick = () => dispatch({ type: 'PLAYER_DEFEND' });
  document.getElementById('btnPotion').onclick = () => dispatch({ type: 'PLAYER_POTION' });
  document.getElementById('btnSave').onclick = () => {
    saveToLocalStorage(state);
    dispatch({ type: 'LOG', line: 'Game saved.' });
  };
  document.getElementById('btnLoad').onclick = () => dispatch({ type: 'LOAD' });
  document.getElementById('btnNew').onclick = () => dispatch({ type: 'NEW' });

  log.innerHTML = state.log
    .slice()
    .reverse()
    .map((line) => `<div class="logLine">${esc(line)}</div>`)
    .join('');
}
