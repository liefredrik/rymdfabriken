import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTerrainGeometry } from '../src/terrain.js';
import { terrainHeight } from '../src/math.js';

test('terrain is subdivided on both axes and agrees with the collision height at every vertex', () => {
  const segments = 60, g = createTerrainGeometry(segments), p = g.attributes.position;
  assert.equal(g.index.count, segments * segments * 6);
  assert.equal(p.count, (segments + 1) ** 2);
  for (let i = 0; i < p.count; i++) {
    assert(Math.abs(p.getY(i) - terrainHeight(p.getX(i), p.getZ(i))) < .001);
    assert(g.attributes.normal.getY(i) > 0, 'terrain faces the sky');
  }
  g.dispose();
});
