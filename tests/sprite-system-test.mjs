import assert from 'assert';
import { SpriteSystem, injectSpriteAnimations } from '../src/sprite-system.js';
describe('SpriteSystem', () => {
  let spriteSystem;
  beforeEach(() => {
    spriteSystem = new SpriteSystem();
  });
  describe('createCharacterPortrait', () => {
    it('should create a portrait container with correct class styling', () => {
      const character = {
        name: 'Hero',
        class: 'warrior'
      };
      const portrait = spriteSystem.createCharacterPortrait(character);
      assert(portrait, 'Portrait container should be created');
      assert.strictEqual(portrait.className, 'character-portrait-container');
      assert(portrait.style.cssText.includes('border-radius'), 'Should have border-radius');
      assert(portrait.style.cssText.includes('DC143C'), 'Warrior class should have red color');
    });
    it('should display character name in portrait', () => {
      const character = { name: 'TestChar', class: 'mage' };
      const portrait = spriteSystem.createCharacterPortrait(character);
      
      const nameDiv = Array.from(portrait.querySelectorAll('div')).find(d => 
        d.textContent === 'TestChar'
      );
      assert(nameDiv, 'Character name should be displayed');
    });
    it('should apply correct aura color for each class', () => {
      const classes = ['warrior', 'mage', 'rogue', 'cleric'];
      
      classes.forEach(charClass => {
        const character = { name: 'Test', class: charClass };
        const portrait = spriteSystem.createCharacterPortrait(character);
        const aura = spriteSystem.classAuras[charClass];
        
        assert(portrait.style.cssText.includes(aura.color), 
          `${charClass} should use correct aura color`);
      });
    });
  });
  describe('createEnemySprite', () => {
    it('should create enemy sprite with element-specific colors', () => {
      const enemy = {
        name: 'Fire Dragon',
        type: 'dragon',
        element: 'fire'
      };
      const sprite = spriteSystem.createEnemySprite(enemy);
      assert(sprite, 'Enemy sprite should be created');
      assert.strictEqual(sprite.className, 'enemy-sprite-container');
      assert(sprite.style.cssText.includes('FF6B35'), 'Fire element should have red color');
    });
    it('should display enemy name in sprite', () => {
      const enemy = { name: 'Skeleton', type: 'undead', element: 'shadow' };
      const sprite = spriteSystem.createEnemySprite(enemy);
      
      const nameDiv = Array.from(sprite.querySelectorAll('div')).find(d => 
        d.textContent === 'Skeleton'
      );
      assert(nameDiv, 'Enemy name should be displayed');
    });
    it('should assign correct element colors', () => {
      const elements = ['fire', 'ice', 'lightning', 'holy', 'shadow', 'nature', 'physical'];
      
      elements.forEach(element => {
        const enemy = { name: 'Test', type: 'test', element };
        const sprite = spriteSystem.createEnemySprite(enemy);
        const expectedColor = spriteSystem.elementColors[element];
        
        assert(sprite.style.cssText.includes(expectedColor), 
          `${element} enemy should use correct color`);
      });
    });
  });
  describe('getClassIcon', () => {
    it('should return correct icon for each class', () => {
      assert.strictEqual(spriteSystem.getClassIcon('warrior'), '');
      assert.strictEqual(spriteSystem.getClassIcon('mage'), '');
      assert.strictEqual(spriteSystem.getClassIcon('rogue'), '');
      assert.strictEqual(spriteSystem.getClassIcon('cleric'), '');
    });
    it('should return default icon for unknown class', () => {
      assert.strictEqual(spriteSystem.getClassIcon('unknown'), '');
    });
  });
  describe('getEnemyIcon', () => {
    it('should return correct icon for undead enemies', () => {
      const icon = spriteSystem.getEnemyIcon('Skeleton', 'physical');
      assert.strictEqual(icon, '');
    });
    it('should return dragon icon for dragon enemies', () => {
      const icon = spriteSystem.getEnemyIcon('Fire Dragon', 'fire');
      assert.strictEqual(icon, '');
    });
    it('should return elemental icons for elementals', () => {
      assert.strictEqual(spriteSystem.getEnemyIcon('Fire Elemental', 'fire'), '');
      assert.strictEqual(spriteSystem.getEnemyIcon('Ice Elemental', 'ice'), '');
      assert.strictEqual(spriteSystem.getEnemyIcon('Lightning Elemental', 'lightning'), '');
      assert.strictEqual(spriteSystem.getEnemyIcon('Nature Elemental', 'nature'), '');
    });
    it('should return default icon for unknown enemy type', () => {
      const icon = spriteSystem.getEnemyIcon('Unknown', 'physical');
      assert.strictEqual(icon, '');
    });
  });
  describe('createStatusEffectOverlay', () => {
    it('should create status effect overlay with correct styling', () => {
      const overlay = spriteSystem.createStatusEffectOverlay('poison', 3);
      assert(overlay, 'Status overlay should be created');
      assert(overlay.className.includes('status-effect-overlay'));
      assert(overlay.textContent.includes('poison'));
    });
    it('should display duration in status effect', () => {
      const overlay = spriteSystem.createStatusEffectOverlay('burn', 5);
      assert(overlay.textContent.includes('(5)'), 'Duration should be shown');
    });
    it('should apply correct colors for each effect type', () => {
      const effects = ['poison', 'burn', 'freeze', 'stun', 'bleed', 'weak', 'strong'];
      
      effects.forEach(effect => {
        const overlay = spriteSystem.createStatusEffectOverlay(effect);
        assert(overlay.style.cssText, `${effect} should have styling`);
      });
    });
    it('should omit duration if not provided', () => {
      const overlay = spriteSystem.createStatusEffectOverlay('stun');
      assert(!overlay.textContent.includes('('), 'Duration should not be shown if not provided');
    });
  });
  describe('createFloatingDamageText', () => {
    it('should create floating damage text element', () => {
      const container = document.createElement('div');
      spriteSystem.createFloatingDamageText(container, 25);
      assert(container.querySelector('.floating-damage-text'), 
        'Floating damage text should be created');
    });
    it('should display correct damage amount', () => {
      const container = document.createElement('div');
      spriteSystem.createFloatingDamageText(container, 42);
      const floatingText = container.querySelector('.floating-damage-text');
      assert.strictEqual(floatingText.textContent, '42');
    });
    it('should use critical styling for critical hits', () => {
      const container = document.createElement('div');
      spriteSystem.createFloatingDamageText(container, 100, true);
      const floatingText = container.querySelector('.floating-damage-text');
      assert(floatingText.style.cssText.includes('24px'), 'Critical damage should have larger font');
      assert(floatingText.style.cssText.includes('FF4500'), 'Critical damage should have orange color');
      assert(floatingText.textContent.includes('!'), 'Critical damage should have exclamation mark');
    });
    it('should use normal styling for regular hits', () => {
      const container = document.createElement('div');
      spriteSystem.createFloatingDamageText(container, 25, false);
      const floatingText = container.querySelector('.floating-damage-text');
      assert(floatingText.style.cssText.includes('16px'), 'Normal damage should have standard font');
    });
  });
  describe('createActionCard', () => {
    it('should create action card with correct structure', () => {
      const action = { name: 'Attack', type: 'attack' };
      const card = spriteSystem.createActionCard(action);
      assert(card, 'Action card should be created');
      assert.strictEqual(card.className, 'action-card');
      assert(card.textContent.includes('Attack'));
    });
    it('should display action name correctly', () => {
      const action = { name: 'Fireball', type: 'spell' };
      const card = spriteSystem.createActionCard(action);
      const nameDiv = Array.from(card.querySelectorAll('div')).find(d => 
        d.textContent === 'Fireball'
      );
      assert(nameDiv, 'Action name should be displayed');
    });
    it('should apply hover effects', () => {
      const action = { name: 'Test Action', type: 'ability' };
      const card = spriteSystem.createActionCard(action);
      assert(card.onmouseenter, 'Should have mouseenter handler');
      assert(card.onmouseleave, 'Should have mouseleave handler');
    });
  });
  describe('getActionIcon', () => {
    it('should return correct icons for action types', () => {
      assert.strictEqual(spriteSystem.getActionIcon('attack'), '');
      assert.strictEqual(spriteSystem.getActionIcon('defend'), '');
      assert.strictEqual(spriteSystem.getActionIcon('spell'), '');
      assert.strictEqual(spriteSystem.getActionIcon('ability'), '');
      assert.strictEqual(spriteSystem.getActionIcon('heal'), '');
      assert.strictEqual(spriteSystem.getActionIcon('item'), '');
    });
    it('should return default icon for unknown action', () => {
      assert.strictEqual(spriteSystem.getActionIcon('unknown'), '');
    });
  });
  describe('injectSpriteAnimations', () => {
    it('should inject CSS animations into document head', () => {
      const initialStyleCount = document.querySelectorAll('style').length;
      injectSpriteAnimations();
      const finalStyleCount = document.querySelectorAll('style').length;
      assert(finalStyleCount > initialStyleCount, 'Style should be injected');
    });
    it('should include float-up animation', () => {
      injectSpriteAnimations();
      const styles = Array.from(document.querySelectorAll('style'));
      const hasFloatUp = styles.some(s => s.textContent.includes('@keyframes float-up'));
      assert(hasFloatUp, 'Should include float-up animation');
    });
    it('should include element-glow animation', () => {
      injectSpriteAnimations();
      const styles = Array.from(document.querySelectorAll('style'));
      const hasGlow = styles.some(s => s.textContent.includes('@keyframes element-glow'));
      assert(hasGlow, 'Should include element-glow animation');
    });
  });
  describe('elementColors', () => {
    it('should have color for all element types', () => {
      const elements = ['fire', 'ice', 'lightning', 'holy', 'shadow', 'nature', 'physical'];
      
      elements.forEach(element => {
        assert(spriteSystem.elementColors[element], 
          `Should have color defined for ${element} element`);
      });
    });
    it('should have valid hex color codes', () => {
      const hexRegex = /^#[0-9A-F]{6}$/i;
      
      Object.entries(spriteSystem.elementColors).forEach(([element, color]) => {
        assert(hexRegex.test(color), 
          `${element} color should be valid hex code, got: ${color}`);
      });
    });
  });
  describe('classAuras', () => {
    it('should have aura definition for each class', () => {
      const classes = ['warrior', 'mage', 'rogue', 'cleric'];
      
      classes.forEach(charClass => {
        assert(spriteSystem.classAuras[charClass], 
          `Should have aura defined for ${charClass}`);
        assert(spriteSystem.classAuras[charClass].color, 
          `${charClass} should have color`);
        assert(spriteSystem.classAuras[charClass].glow, 
          `${charClass} should have glow value`);
      });
    });
  });
});
