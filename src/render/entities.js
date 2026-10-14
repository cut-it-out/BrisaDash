import * as THREE from 'three';
import { CONFIG } from '../game/config.js';
import { lanePosition } from '../game/lanes.js';
import { PALETTE } from './palette.js';

const RUNNER_HEIGHT = 1.3;
const BOB_HEIGHT = 0.12; // (tune)
const BOB_STEPS_PER_SECOND = 5; // (tune)

// Placeholder runner (a block) until the Kenney character arrives in Phase 4
export function createRunner(scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, RUNNER_HEIGHT, 0.45),
    new THREE.MeshLambertMaterial({ color: PALETTE.deepOcean }),
  );
  scene.add(mesh);
  const middle = Math.floor(CONFIG.laneCount / 2);

  function update(laneState, timeSeconds) {
    mesh.position.x = (lanePosition(laneState) - middle) * CONFIG.laneWidth;
    const bob = Math.abs(Math.sin(timeSeconds * Math.PI * BOB_STEPS_PER_SECOND)) * BOB_HEIGHT;
    mesh.position.y = RUNNER_HEIGHT / 2 + bob;
  }

  return { update };
}
