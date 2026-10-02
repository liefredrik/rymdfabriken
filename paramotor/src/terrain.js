import * as THREE from 'three';
import { terrainHeight } from './math.js';

export function createTerrainGeometry(segments = 440) {
  const geometry = new THREE.PlaneGeometry(14000, 14000, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) positions.setY(i, terrainHeight(positions.getX(i), positions.getZ(i)));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
