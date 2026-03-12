/**
 * Enhanced Sprite Rendering System for RPG
 * Provides visual improvements for characters, enemies, and battle effects
 */
export class SpriteSystem {
  constructor() {
    this.spriteCache = new Map();
    this.elementColors = {
      fire: '#FF6B35',
      ice: '#4A90E2',
      lightning: '#FFD700',
      holy: '#F0E68C',
      shadow: '#9370DB',
      nature: '#7CFC00',
      physical: '#A9A9A9'
    };
    this.classAuras = {
      warrior: { color: '#DC143C', glow: 8 },
      mage: { color: '#9370DB', glow: 10 },
      rogue: { color: '#32CD32', glow: 6 },
      cleric: { color: '#FFD700', glow: 10 }
    };
  }
  /**
   * Create character portrait container with class-specific styling
   */
  createCharacterPortrait(character) {
    const container = document.createElement('div');
    container.className = 'character-portrait-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.2));
      border: 2px solid ${this.classAuras[character.class]?.color || '#CCCCCC'};
      box-shadow: 0 0 ${this.classAuras[character.class]?.glow || 5}px ${this.classAuras[character.class]?.color || '#999999'}88;
    `;
    // Portrait section
    const portraitDiv = document.createElement('div');
    portraitDiv.className = 'character-portrait';
    portraitDiv.style.cssText = `
      width: 80px;
      height: 100px;
      border-radius: 4px;
      background: linear-gradient(45deg, #333333, #555555);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 32px;
      border: 1px solid ${this.classAuras[character.class]?.color || '#999999'};
    `;
    portraitDiv.textContent = this.getClassIcon(character.class);
    container.appendChild(portraitDiv);
    // Character name
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = `
      font-weight: bold;
      font-size: 12px;
      text-align: center;
      color: white;
    `;
    nameDiv.textContent = character.name;
    container.appendChild(nameDiv);
    return container;
  }
  /**
   * Create enemy sprite with element-specific visual effects
   */
  createEnemySprite(enemy) {
    const container = document.createElement('div');
    container.className = 'enemy-sprite-container';
    
    const elementColor = this.elementColors[enemy.element] || '#CCCCCC';
    
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px;
    `;
    // Enemy visual representation
    const spriteDiv = document.createElement('div');
    spriteDiv.className = 'enemy-sprite';
    spriteDiv.style.cssText = `
      width: 60px;
      height: 80px;
      border-radius: 4px;
      background: linear-gradient(45deg, ${elementColor}44, ${elementColor}22);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      border: 2px solid ${elementColor};
      box-shadow: 0 0 10px ${elementColor}66;
      position: relative;
    `;
    
    spriteDiv.textContent = this.getEnemyIcon(enemy.type, enemy.element);
    container.appendChild(spriteDiv);
    // Enemy name
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = `
      font-weight: bold;
      font-size: 11px;
      text-align: center;
      color: white;
    `;
    nameDiv.textContent = enemy.name;
    container.appendChild(nameDiv);
    return container;
  }
  /**
   * Get class-specific icon emoji
   */
  getClassIcon(characterClass) {
    const icons = {
      warrior: '',
      mage: '',
      rogue: '',
      cleric: ''
    };
    return icons[characterClass] || '';
  }
  /**
   * Get enemy-specific icon based on type and element
   */
  getEnemyIcon(enemyType, element) {
    // Map enemy types to visual icons
    if (enemyType.toLowerCase().includes('skeleton') || enemyType.toLowerCase().includes('undead')) {
      return '';
    }
    if (enemyType.toLowerCase().includes('dragon')) {
      return '';
    }
    if (enemyType.toLowerCase().includes('golem')) {
      return '';
    }
    if (enemyType.toLowerCase().includes('spirit')) {
      return '';
    }
    if (enemyType.toLowerCase().includes('elemental')) {
      if (element === 'fire') return '';
      if (element === 'ice') return '';
      if (element === 'lightning') return '';
      if (element === 'nature') return '';
    }
    return '';
  }
  /**
   * Create status effect visual overlay
   */
  createStatusEffectOverlay(effect, duration) {
    const overlay = document.createElement('div');
    overlay.className = 'status-effect-overlay';
    
    const effectColors = {
      poison: { bg: '#90EE90', text: '#228B22' },
      burn: { bg: '#FFB6C1', text: '#DC143C' },
      freeze: { bg: '#87CEEB', text: '#4169E1' },
      stun: { bg: '#FFD700', text: '#FF8C00' },
      bleed: { bg: '#FF6347', text: '#8B0000' },
      weak: { bg: '#D3D3D3', text: '#696969' },
      strong: { bg: '#FFD700', text: '#FF4500' }
    };
    
    const colors = effectColors[effect] || { bg: '#C0C0C0', text: '#000000' };
    
    overlay.style.cssText = `
      display: inline-block;
      padding: 4px 8px;
      margin: 2px;
      border-radius: 4px;
      background-color: ${colors.bg};
      color: ${colors.text};
      font-size: 11px;
      font-weight: bold;
      border: 1px solid ${colors.text};
    `;
    
    overlay.textContent = `${effect}${duration ? ` (${duration})` : ''}`;
    
    return overlay;
  }
  /**
   * Create floating damage text animation
   */
  createFloatingDamageText(element, damage, isCritical = false) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-damage-text';
    
    const color = isCritical ? '#FF4500' : '#FFFFFF';
    const fontSize = isCritical ? '24px' : '16px';
    const fontWeight = isCritical ? 'bold' : 'normal';
    
    floatingText.style.cssText = `
      position: absolute;
      font-size: ${fontSize};
      font-weight: ${fontWeight};
      color: ${color};
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      pointer-events: none;
      z-index: 1000;
      animation: float-up 1s ease-out forwards;
    `;
    
    floatingText.textContent = isCritical ? `${damage}!` : damage.toString();
    
    element.appendChild(floatingText);
    
    setTimeout(() => floatingText.remove(), 1000);
  }
  /**
   * Create action card for combat abilities
   */
  createActionCard(action) {
    const card = document.createElement('div');
    card.className = 'action-card';
    card.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border-radius: 6px;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.3));
      border: 2px solid rgba(255,255,255,0.2);
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 80px;
    `;
    // Action icon
    const iconDiv = document.createElement('div');
    iconDiv.style.cssText = `
      font-size: 24px;
    `;
    iconDiv.textContent = this.getActionIcon(action.type);
    card.appendChild(iconDiv);
    // Action name
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = `
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      color: white;
    `;
    nameDiv.textContent = action.name;
    card.appendChild(nameDiv);
    // Hover effect
    card.addEventListener('mouseenter', () => {
      card.style.backgroundColor = 'rgba(255,255,255,0.15)';
      card.style.boxShadow = '0 0 8px rgba(255,255,255,0.3)';
      card.style.transform = 'scale(1.05)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.backgroundColor = 'rgba(255,255,255,0.1)';
      card.style.boxShadow = 'none';
      card.style.transform = 'scale(1)';
    });
    return card;
  }
  /**
   * Get action-specific icon
   */
  getActionIcon(actionType) {
    const icons = {
      attack: '',
      defend: '',
      spell: '',
      ability: '',
      heal: '',
      item: ''
    };
    return icons[actionType] || '';
  }
}
// CSS animations for sprite effects
export function injectSpriteAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float-up {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(-50px) scale(0.8);
      }
    }
    @keyframes sprite-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
    @keyframes element-glow {
      0%, 100% {
        box-shadow: 0 0 8px currentColor;
      }
      50% {
        box-shadow: 0 0 16px currentColor;
      }
    }
    .character-portrait-container {
      transition: all 0.3s ease;
    }
    .character-portrait-container:hover {
      transform: scale(1.05);
    }
    .enemy-sprite-container {
      transition: all 0.3s ease;
    }
    .enemy-sprite {
      animation: sprite-pulse 2s ease-in-out infinite;
    }
    .action-card {
      user-select: none;
    }
    .action-card:active {
      transform: scale(0.95);
    }
  `;
  document.head.appendChild(style);
}
