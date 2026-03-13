import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderAtmospherePanel, getLocationData, getAmbientEvent, getAllLocations } from '../src/location-atmosphere.js';

describe('Location Atmosphere Integration', () => {
  it('renderAtmospherePanel returns HTML for valid exploration state', () => {
    const state = { world: { roomRow: 1, roomCol: 1 } }; // Village Square
    const html = renderAtmospherePanel(state);
    assert.ok(html.includes('atmosphere-panel'), 'Should contain atmosphere-panel class');
    assert.ok(html.includes('Village Square'), 'Should show Village Square for center position');
  });

  it('renderAtmospherePanel returns fallback for unknown coordinates', () => {
    const state = { world: { roomRow: 99, roomCol: 99 } };
    const html = renderAtmospherePanel(state);
    assert.ok(html.includes('unremarkable'), 'Should show fallback text');
  });

  it('renderAtmospherePanel handles missing state gracefully', () => {
    const html = renderAtmospherePanel({});
    assert.ok(typeof html === 'string', 'Should return a string');
  });

  it('renderAtmospherePanel handles null state gracefully', () => {
    const html = renderAtmospherePanel(null);
    assert.ok(typeof html === 'string', 'Should return a string');
  });

  it('all 9 locations returned by getAllLocations', () => {
    const locations = getAllLocations();
    assert.equal(locations.length, 9, 'Should have 9 locations');
    for (const loc of locations) {
      assert.ok(loc.name, `Location should have a name`);
      assert.ok(loc.icon, `Location should have an icon`);
      assert.ok(loc.id, `Location should have an id`);
    }
  });

  it('each location renders its icon and name in the panel', () => {
    const coords = [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1], [2, 2],
    ];
    for (const [row, col] of coords) {
      const state = { world: { roomRow: row, roomCol: col } };
      const html = renderAtmospherePanel(state);
      assert.ok(html.includes('atmosphere-panel'), `Panel for (${row},${col}) should have class`);
      assert.ok(html.includes('<strong>'), `Panel for (${row},${col}) should have bold name`);
    }
  });

  it('getAmbientEvent returns a string for known rooms', () => {
    const roomIds = ['nw', 'n', 'ne', 'w', 'center', 'e', 'sw', 's', 'se'];
    for (const id of roomIds) {
      const event = getAmbientEvent(id);
      assert.ok(typeof event === 'string', `Ambient event for ${id} should be string`);
      assert.ok(event.length > 0, `Ambient event for ${id} should not be empty`);
    }
  });

  it('getLocationData returns data by roomId', () => {
    const data = getLocationData({ roomId: 'center' });
    assert.equal(data.name, 'Village Square');
  });

  it('getLocationData returns data by coordinates', () => {
    const data = getLocationData({ roomRow: 0, roomCol: 0 });
    assert.equal(data.name, 'Northwest Grove');
  });

  it('getLocationData returns null for unknown room', () => {
    const data = getLocationData({ roomId: 'nonexistent' });
    assert.equal(data, null);
  });

  it('render.js imports renderAtmospherePanel', async () => {
    const fs = await import('node:fs');
    const renderContent = fs.readFileSync('src/render.js', 'utf8');
    assert.ok(
      renderContent.includes("import { renderAtmospherePanel } from './location-atmosphere.js'"),
      'render.js should import renderAtmospherePanel'
    );
    assert.ok(
      renderContent.includes('renderAtmospherePanel(state)'),
      'render.js should call renderAtmospherePanel(state) in exploration view'
    );
  });
});
