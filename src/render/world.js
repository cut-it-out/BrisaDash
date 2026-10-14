import * as THREE from 'three';
import { CONFIG } from '../game/config.js';
import { bakeModel, instancedModel } from './models.js';
import { PALETTE } from './palette.js';

const NEAR_Z = 8; // just behind the camera
const FAR_Z = -72; // past the fog
const SPAN = NEAR_Z - FAR_Z;
const DASH_LENGTH = 1.5;
const DASH_SPACING = 4;
const DASHES_PER_LINE = SPAN / DASH_SPACING;
const KERB_WIDTH = 0.2;

function flatPlane(width, length, color, x, y) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshLambertMaterial({ color }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, (NEAR_Z + FAR_Z) / 2);
  return mesh;
}

// The ground, track, kerbs and sea stay still; only the lane-line dashes move,
// recycled by wrapping their z over a fixed span, so the track costs a handful of draw calls.
export function createWorld(scene) {
  const trackWidth = CONFIG.laneCount * CONFIG.laneWidth;
  const halfTrack = trackWidth / 2;

  scene.add(flatPlane(200, SPAN, PALETTE.beachSand, 0, 0));
  scene.add(flatPlane(trackWidth, SPAN, PALETTE.sunlitSand, 0, 0.01));
  scene.add(flatPlane(100, SPAN, PALETTE.brisaTurquoise, -halfTrack - 2.5 - 50, 0.005)); // sea on the left

  const kerbGeometry = new THREE.BoxGeometry(KERB_WIDTH, 0.12, SPAN);
  const kerbMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.seaSaltWhite });
  for (const side of [-1, 1]) {
    const kerb = new THREE.Mesh(kerbGeometry, kerbMaterial);
    kerb.position.set(side * (halfTrack + KERB_WIDTH / 2), 0.06, (NEAR_Z + FAR_Z) / 2);
    scene.add(kerb);
  }

  // Lane-line dashes between lanes: one InstancedMesh, one draw call
  const lineXs = [];
  for (let i = 1; i < CONFIG.laneCount; i++) lineXs.push(-halfTrack + i * CONFIG.laneWidth);
  const dashes = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.08, DASH_LENGTH).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: PALETTE.laneLine }),
    lineXs.length * DASHES_PER_LINE,
  );
  dashes.frustumCulled = false; // instances move every frame; the default bounds would go stale
  scene.add(dashes);
  const matrix = new THREE.Matrix4();

  function update(distance) {
    let index = 0;
    for (const x of lineXs) {
      for (let i = 0; i < DASHES_PER_LINE; i++) {
        const z = FAR_Z + ((i * DASH_SPACING + distance) % SPAN);
        matrix.makeTranslation(x, 0.02, z);
        dashes.setMatrixAt(index++, matrix);
      }
    }
    dashes.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { update };
}

// Palms and rocks beside the track (Kenney Nature Kit, GDD §7). A fixed layout repeats every SPAN metres,
// wrapped in z like the dashes. One InstancedMesh per model, so each model costs one draw call per material.
// [model, x, offset along the span (m), height (m), turn (radians)]; the sea starts at x ≈ -4.75
const SCENERY_LAYOUT = [
  ['palmTall', -4.0, 0, 4.4, 0.4],
  ['rockSmall', -4.6, 9, 0.5, 1.2],
  ['palm', -4.0, 17, 4, 2.1],
  ['palmBend', -4.1, 35, 3.8, 3.6],
  ['rockLarge', -4.6, 44, 0.6, 0.3],
  ['palmTall', -4.0, 52, 4.6, 5.1],
  ['palm', -4.0, 68, 4.2, 1.0],
  ['palm', 4.3, 7, 4.2, 2.8],
  ['rockLarge', 3.4, 15, 0.7, 4.0],
  ['palmBend', 7.0, 24, 3.9, 0.9],
  ['palmTall', 4.3, 40, 4.5, 4.4],
  ['rockSmall', 3.3, 49, 0.45, 2.2],
  ['palm', 7.2, 58, 4, 5.9],
  ['palmBend', 4.3, 74, 3.8, 1.7],
];

export function createScenery(scene, models) {
  const byModel = new Map();
  for (const [name, x, offset, height, turn] of SCENERY_LAYOUT) {
    if (!models[name]) continue; // a missing model just leaves gaps in the scenery
    if (!byModel.has(name)) byModel.set(name, []);
    byModel.get(name).push({ x, offset, height, turn });
  }

  const groups = [...byModel].map(([name, placements]) => {
    const baked = bakeModel(models[name], 1); // unit height; each placement scales it
    const mesh = instancedModel(scene, baked, placements.length);
    mesh.count = placements.length;
    return { mesh, placements };
  });
  const dummy = new THREE.Object3D();

  function update(distance) {
    for (const { mesh, placements } of groups) {
      placements.forEach((p, i) => {
        dummy.position.set(p.x, 0, FAR_Z + ((p.offset + distance) % SPAN));
        dummy.rotation.set(0, p.turn, 0);
        dummy.scale.setScalar(p.height);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
  update(0);

  return { update };
}
