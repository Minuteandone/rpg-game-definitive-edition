import assert from 'node:assert/strict';
import { createSfx, DEFAULT_CATEGORIES } from '../src/audio/sfx.js';

(async () => {
  const sfx = createSfx();
    assert.equal(typeof sfx.init, 'function');
      assert.equal(typeof sfx.play, 'function');
        assert.equal(typeof sfx.mute, 'function');
          assert.equal(typeof sfx.setMasterVolume, 'function');
            assert.equal(typeof sfx.setCategoryVolume, 'function');
              assert.equal(typeof sfx.stopAll, 'function');
                assert.equal(typeof sfx.dispose, 'function');
                  assert.equal(typeof sfx.isEnabled, 'function');
                    assert.equal(typeof sfx.getVolumes, 'function');
                      assert.equal(typeof sfx.getRegistry, 'function');
                        assert.equal(typeof sfx.hasSound, 'function');

                          const enabled = await sfx.init();
                            assert.equal(enabled, false, 'init() should resolve false in Node');
                              assert.equal(sfx.isEnabled(), false);

                                // Registry checks
                                  const reg = sfx.getRegistry();
                                    const expected = [
                                        'ui_click', 'ui_confirm', 'ui_cancel',
                                            'map_step', 'map_blocked',
                                                'combat_attack', 'combat_hit', 'combat_crit', 'combat_heal', 'combat_item', 'combat_victory', 'combat_defeat'
                                                  ];
                                                    for (const key of expected) {
                                                        assert.ok(reg[key], `registry should contain ${key}`);
                                                            assert.ok(sfx.hasSound(key));
                                                              }

                                                                // No-throw play()
                                                                  assert.doesNotThrow(() => sfx.play('ui_click'));

                                                                    // Volumes and mute
                                                                      sfx.setMasterVolume(0.8);
                                                                        sfx.setCategoryVolume('ui', 0.5);
                                                                          sfx.setCategoryVolume('combat', 2); // clamp
                                                                            sfx.setCategoryVolume('map', -1);   // clamp
                                                                              sfx.mute(true);
                                                                                const vols = sfx.getVolumes();
                                                                                  assert.equal(vols.master, 0.8);
                                                                                    assert.equal(vols.categories.ui, 0.5);
                                                                                      assert.equal(vols.categories.combat, 1);
                                                                                        assert.equal(vols.categories.map, 0);
                                                                                          assert.equal(vols.muted, true);

                                                                                            // DEFAULT_CATEGORIES export sanity
                                                                                              assert.deepEqual(DEFAULT_CATEGORIES.sort(), ['combat','map','ui'].sort());

                                                                                                console.log('[audio-test] OK');
                                                                                                })();