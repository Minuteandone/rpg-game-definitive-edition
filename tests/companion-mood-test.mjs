import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  getCompanionMood,
  getMoodChange,
  getMoodDisplayText,
  getAllCompanionMoods,
  createMoodNotification,
  MOOD_STATES,
} from '../src/companion-mood.js';

describe('Companion Mood Indicators', () => {
  describe('getCompanionMood', () => {
    it('should return ABANDONED mood for loyalty 0', () => {
      const mood = getCompanionMood(0);
      expect(mood).to.deep.equal(MOOD_STATES.ABANDONED);
      expect(mood.emoji).to.equal('💔');
    });

    it('should return DISCONTENT mood for loyalty 10', () => {
      const mood = getCompanionMood(10);
      expect(mood).to.deep.equal(MOOD_STATES.DISCONTENT);
      expect(mood.emoji).to.equal('😠');
    });

    it('should return NEUTRAL mood for loyalty 25', () => {
      const mood = getCompanionMood(25);
      expect(mood).to.deep.equal(MOOD_STATES.NEUTRAL);
      expect(mood.emoji).to.equal('😐');
    });

    it('should return FRIENDLY mood for loyalty 50', () => {
      const mood = getCompanionMood(50);
      expect(mood).to.deep.equal(MOOD_STATES.FRIENDLY);
      expect(mood.emoji).to.equal('😊');
    });

    it('should return DEVOTED mood for loyalty 75', () => {
      const mood = getCompanionMood(75);
      expect(mood).to.deep.equal(MOOD_STATES.DEVOTED);
      expect(mood.emoji).to.equal('😄');
    });

    it('should return SOULBOUND mood for loyalty 100', () => {
      const mood = getCompanionMood(100);
      expect(mood).to.deep.equal(MOOD_STATES.SOULBOUND);
      expect(mood.emoji).to.equal('💖');
    });

    it('should handle edge case loyalty 99 as DEVOTED', () => {
      const mood = getCompanionMood(99);
      expect(mood.emoji).to.equal('😄');
    });

    it('should handle edge case loyalty 51 as FRIENDLY', () => {
      const mood = getCompanionMood(51);
      expect(mood.emoji).to.equal('😊');
    });
  });

  describe('getMoodChange', () => {
    it('should detect mood improvement from NEUTRAL to FRIENDLY', () => {
      const change = getMoodChange(25, 50);
      expect(change).to.equal('improved');
    });

    it('should detect mood decline from FRIENDLY to NEUTRAL', () => {
      const change = getMoodChange(50, 25);
      expect(change).to.equal('declined');
    });

    it('should detect stable mood within same tier', () => {
      const change = getMoodChange(50, 60);
      expect(change).to.equal('stable');
    });

    it('should detect improvement from DISCONTENT to NEUTRAL', () => {
      const change = getMoodChange(10, 25);
      expect(change).to.equal('improved');
    });

    it('should detect decline from SOULBOUND to DEVOTED', () => {
      const change = getMoodChange(100, 75);
      expect(change).to.equal('declined');
    });

    it('should detect stable mood at same value', () => {
      const change = getMoodChange(50, 50);
      expect(change).to.equal('stable');
    });
  });

  describe('getMoodDisplayText', () => {
    it('should format improvement text', () => {
      const mood = getCompanionMood(50);
      const text = getMoodDisplayText('Fenris', mood, 'improved');
      expect(text).to.include('Fenris');
      expect(text).to.include('happy');
      expect(text).to.include('😊');
    });

    it('should format decline text', () => {
      const mood = getCompanionMood(25);
      const text = getMoodDisplayText('Lyra', mood, 'declined');
      expect(text).to.include('Lyra');
      expect(text).to.include('neutral');
      expect(text).to.include('😐');
    });

    it('should format stable text', () => {
      const mood = getCompanionMood(75);
      const text = getMoodDisplayText('Companion', mood, 'stable');
      expect(text).to.include('Companion');
      expect(text).to.include('devoted');
      expect(text).to.include('😄');
    });
  });

  describe('getAllCompanionMoods', () => {
    it('should return empty object for no companions', () => {
      const state = { companions: [] };
      const moods = getAllCompanionMoods(state);
      expect(moods).to.deep.equal({});
    });

    it('should return mood data for all companions', () => {
      const state = {
        companions: [
          { id: 'fenris', name: 'Fenris', loyalty: 50, soulbound: false },
          { id: 'lyra', name: 'Lyra', loyalty: 75, soulbound: false },
        ],
      };
      const moods = getAllCompanionMoods(state);
      expect(moods).to.have.all.keys('fenris', 'lyra');
      expect(moods.fenris.mood.emoji).to.equal('😊');
      expect(moods.lyra.mood.emoji).to.equal('😄');
    });

    it('should handle missing loyalty as 0', () => {
      const state = {
        companions: [{ id: 'unknown', name: 'Unknown' }],
      };
      const moods = getAllCompanionMoods(state);
      expect(moods.unknown.mood.emoji).to.equal('💔');
    });

    it('should track soulbound status', () => {
      const state = {
        companions: [
          { id: 'bonded', name: 'Bonded', loyalty: 100, soulbound: true },
        ],
      };
      const moods = getAllCompanionMoods(state);
      expect(moods.bonded.soulbound).to.equal(true);
    });
  });

  describe('createMoodNotification', () => {
    it('should create improvement notification', () => {
      const text = createMoodNotification('Fenris', 25, 50);
      expect(text).to.include('Fenris');
      expect(text).to.include('improved');
      expect(text).to.include('😐');
      expect(text).to.include('😊');
    });

    it('should create decline notification', () => {
      const text = createMoodNotification('Lyra', 75, 50);
      expect(text).to.include('Lyra');
      expect(text).to.include('declined');
      expect(text).to.include('😄');
      expect(text).to.include('😊');
    });

    it('should create stable notification', () => {
      const text = createMoodNotification('Companion', 50, 60);
      expect(text).to.include('Companion');
      expect(text).to.include('😊');
      expect(text).to.include('Happy');
    });

    it('should handle soulbound notification', () => {
      const text = createMoodNotification('Bonded', 75, 100);
      expect(text).to.include('Bonded');
      expect(text).to.include('improved');
      expect(text).to.include('💖');
    });

    it('should handle abandoned notification', () => {
      const text = createMoodNotification('Sad', 10, 0);
      expect(text).to.include('Sad');
      expect(text).to.include('declined');
      expect(text).to.include('💔');
    });
  });

  describe('MOOD_STATES constants', () => {
    it('should have all required mood states', () => {
      const requiredMoods = [
        'ABANDONED',
        'DISCONTENT',
        'NEUTRAL',
        'FRIENDLY',
        'DEVOTED',
        'SOULBOUND',
      ];
      for (const mood of requiredMoods) {
        expect(MOOD_STATES).to.have.property(mood);
      }
    });

    it('should have proper structure for each mood', () => {
      for (const [key, mood] of Object.entries(MOOD_STATES)) {
        expect(mood).to.have.property('tier');
        expect(mood).to.have.property('emoji');
        expect(mood).to.have.property('label');
        expect(mood).to.have.property('description');
        expect(mood).to.have.property('color');
        expect(mood.emoji).to.be.a('string');
        expect(mood.color).to.match(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });
});
