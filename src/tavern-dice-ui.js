export function renderTavernDicePanel(state) {
  const td = state.tavernDice || { isActive: false, pot: 0, streak: 0, message: 'Welcome to the Tavern!' };
  
  let html = `<div class="tavern-dice-panel card">`;
  html += `<h2>High-Low Dice Game</h2>`;
  html += `<p class="tavern-message">${td.message}</p>`;

  if (td.isActive) {
    html += `<div class="tavern-stats">`;
    html += `<p>Current Roll: <strong>${td.currentRoll}</strong></p>`;
    html += `<p>Pot: <strong>${td.pot}g</strong></p>`;
    html += `<p>Streak: <strong>${td.streak}</strong></p>`;
    if (td.streak >= 3) {
      html += `<p class="bonus-text" style="color:#ffd700;">Win Streak Bonus Active! (1.5x on cash out)</p>`;
    }
    html += `</div>`;
    html += `<div class="buttons tavern-actions" style="margin-top:10px; display:flex; gap:10px;">`;
    html += `<button data-action="TAVERN_GUESS" data-guess="higher">Higher</button>`;
    html += `<button data-action="TAVERN_GUESS" data-guess="lower">Lower</button>`;
    html += `<button data-action="TAVERN_CASH_OUT">Cash Out</button>`;
    html += `</div>`;
  } else {
    html += `<div class="tavern-wager">`;
    html += `<p>Your Gold: ${state.player?.gold || 0}g</p>`;
    html += `<div class="buttons" style="margin-top:10px; display:flex; gap:10px;">`;
    html += `<button data-action="TAVERN_START" data-wager="1">Wager 1g</button>`;
    html += `<button data-action="TAVERN_START" data-wager="5">Wager 5g</button>`;
    html += `<button data-action="TAVERN_START" data-wager="10">Wager 10g</button>`;
    html += `<button data-action="TAVERN_START" data-wager="50">Wager 50g</button>`;
    html += `<button data-action="TAVERN_START" data-wager="100">Wager 100g</button>`;
    html += `</div>`;
    html += `</div>`;
  }
  
  html += `</div>`;
  return html;
}
