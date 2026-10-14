import * as THREE from 'three';
import { CONFIG } from '../game/config.js';
import { bakeModel, instancedModel, painted, primitiveModel } from './models.js';
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

// Scenery beside the track (GDD §7): Nature Kit palms, sandy rocks and gray stones, City Kit (Suburban) houses
// on the right and Watercraft Kit boats on the sea. A fixed layout repeats every SPAN metres, wrapped in z like
// the dashes. One InstancedMesh per model, so each model costs one draw call per material.
// [model, x, offset along the span (m), height (m), turn (radians)]; the sea starts at x ≈ -4.75
const SCENERY_LAYOUT = [
  // Sea side: palms, rocks and stones on the sand, a few stones in the shallows, boats further out
  ['palmTall', -4.0, 0, 4.4, 0.4],
  ['rockSmall', -4.6, 9, 0.5, 1.2],
  ['stoneLarge', -5.8, 14, 0.5, 0.8],
  ['boatSail', -11, 20, 4.5, 0.3],
  ['stoneSmall', -4.4, 27, 0.35, 2.0],
  ['palmBend', -4.1, 35, 3.8, 3.6],
  ['rockLarge', -4.6, 44, 0.6, 0.3],
  ['boatSpeed', -8, 48, 1.3, 2.9],
  ['stoneRound', -6.3, 55, 0.7, 1.4],
  ['stoneSmall', -5.4, 61, 0.3, 4.1],
  ['palm', -4.0, 68, 4.2, 1.0],
  ['boatFishing', -10, 72, 2.4, -0.4],
  // Town side: palms by the kerb, stones, and a row of white villas behind them, facing the track
  ['palm', 4.3, 7, 4.2, 2.8],
  ['houseVilla', 10, 4, 3.4, -Math.PI / 2],
  ['rockLarge', 4.5, 15, 0.7, 4.0],
  ['houseNarrow', 9, 20, 5.5, -Math.PI / 2],
  ['stoneRound', 3.5, 31, 0.6, 0.6],
  ['houseBungalow', 10, 36, 3.2, -Math.PI / 2],
  ['palmTall', 4.3, 40, 4.5, 4.4],
  ['rockSmall', 3.3, 49, 0.45, 2.2],
  ['houseBalcony', 9, 54, 5.5, -Math.PI / 2],
  ['stoneLarge', 5.6, 64, 0.45, 2.5],
  ['houseVilla', 10, 70, 3.4, -Math.PI / 2],
  ['palmBend', 4.3, 74, 3.8, 1.7],
];

// Nature Kit stones are pale cyan; every material (some have a white second one) is tinted gray
const SCENERY_TINTS = { stoneSmall: PALETTE.stoneGrey, stoneLarge: PALETTE.stoneGrey, stoneRound: PALETTE.stoneGrey };
const BOAT_BOB = 0.08; // metres
const BOAT_ROLL = 0.05; // radians
const BOAT_DRAFT = 0.12; // how far the hull sits below the water line
const TRACK_CLEARANCE = 0.25; // gap between the kerb and the nearest scenery (palm leaves may overhang)

// Pushes a placement sideways, if needed, so its turned footprint stays clear of the track and kerbs:
// a rock reaching into a lane looks like an obstacle
function clearOfTrack(placement, box) {
  const hx = ((box.max.x - box.min.x) / 2) * placement.height;
  const hz = ((box.max.z - box.min.z) / 2) * placement.height;
  const reach = Math.abs(Math.cos(placement.turn)) * hx + Math.abs(Math.sin(placement.turn)) * hz;
  const nearest = (CONFIG.laneCount * CONFIG.laneWidth) / 2 + KERB_WIDTH + TRACK_CLEARANCE + reach;
  return { ...placement, x: Math.sign(placement.x) * Math.max(Math.abs(placement.x), nearest) };
}

export function createScenery(scene, models) {
  const byModel = new Map();
  for (const [name, x, offset, height, turn] of SCENERY_LAYOUT) {
    if (!models[name]) continue; // a missing model just leaves gaps in the scenery
    if (!byModel.has(name)) byModel.set(name, []);
    byModel.get(name).push({ x, offset, height, turn });
  }

  const groups = [...byModel].map(([name, placements]) => {
    const baked = bakeModel(models[name], 1); // unit height; each placement scales it
    if (SCENERY_TINTS[name]) for (const material of baked.materials) material.color.set(SCENERY_TINTS[name]);
    baked.geometry.computeBoundingBox();
    const placed = name.startsWith('palm') ? placements : placements.map((p) => clearOfTrack(p, baked.geometry.boundingBox));
    const mesh = instancedModel(scene, baked, placed.length);
    mesh.count = placed.length;
    return { mesh, placements: placed, floats: name.startsWith('boat') };
  });
  const dummy = new THREE.Object3D();

  function update(distance, timeSeconds = 0) {
    for (const { mesh, placements, floats } of groups) {
      placements.forEach((p, i) => {
        dummy.position.set(p.x, 0, FAR_Z + ((p.offset + distance) % SPAN));
        dummy.rotation.set(0, p.turn, 0);
        if (floats) {
          const phase = timeSeconds * 1.4 + p.offset;
          dummy.position.y = Math.sin(phase) * BOAT_BOB - BOAT_DRAFT;
          dummy.rotation.z = Math.sin(phase * 0.8) * BOAT_ROLL;
        }
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

// Seagulls from primitives (no pack has one): a white body, grey wings in a shallow V with dark tips
// and a coral beak, about 0.9 m across before scaling. Each gull circles over the sea ahead of the runner, as if
// following the barista for crumbs, banking into the turn with a slow bob. Code-driven, no rig.
const GULL_WING_LIFT = 0.25; // radians
const GULL_WING_SPAN = 0.42; // one wing

function seagullModel() {
  const wing = (side) => [
    painted(
      new THREE.BoxGeometry(GULL_WING_SPAN, 0.02, 0.16)
        .translate((side * GULL_WING_SPAN) / 2, 0, 0)
        .rotateZ(side * GULL_WING_LIFT),
      PALETTE.gullGrey,
    ),
    painted(
      new THREE.BoxGeometry(0.1, 0.025, 0.12)
        .translate(side * (GULL_WING_SPAN + 0.03), 0, 0.01)
        .rotateZ(side * GULL_WING_LIFT),
      PALETTE.deepOcean,
    ),
  ];
  return primitiveModel([
    painted(new THREE.BoxGeometry(0.12, 0.1, 0.36), PALETTE.seaSaltWhite),
    painted(new THREE.BoxGeometry(0.09, 0.08, 0.1).translate(0, 0.05, -0.2), PALETTE.seaSaltWhite),
    painted(new THREE.BoxGeometry(0.03, 0.03, 0.08).translate(0, 0.04, -0.28), PALETTE.sunsetCoral),
    painted(new THREE.BoxGeometry(0.1, 0.02, 0.12).translate(0, 0, 0.22), PALETTE.seaSaltWhite), // tail
    ...wing(-1),
    ...wing(1),
  ]);
}

// [centre x, height, centre z, radius, turn speed (rad/s), start angle]; the sea starts at x ≈ -4.75
const GULL_PATHS = [
  [-6.5, 3.6, -13, 2.5, 0.45, 0],
  [-8, 4.6, -22, 3.5, -0.35, 2],
  [-6, 4.2, -32, 3, 0.3, 4],
  [-10, 5.4, -18, 4, -0.25, 1],
];
const GULL_SCALE = 1.6; // the model is about 0.9 m across; bigger reads better on a phone

export function createSeagulls(scene, count) {
  const paths = GULL_PATHS.slice(0, Math.max(0, Math.floor(count)));
  if (paths.length === 0) return { update() {} };
  const mesh = instancedModel(scene, seagullModel(), paths.length);
  mesh.count = paths.length;
  const dummy = new THREE.Object3D();
  dummy.scale.setScalar(GULL_SCALE);

  function update(timeSeconds) {
    paths.forEach(([cx, cy, cz, radius, turnSpeed, start], i) => {
      const angle = start + timeSeconds * turnSpeed;
      dummy.position.set(cx + Math.cos(angle) * radius, cy + Math.sin(timeSeconds * 1.3 + i) * 0.25, cz + Math.sin(angle) * radius);
      // Face along the circle (the model's beak points to -z) and lean into the turn
      const turn = Math.sign(turnSpeed);
      dummy.rotation.set(0, ((1 + turn) * Math.PI) / 2 - angle, -turn * 0.35, 'YXZ');
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { update };
}
