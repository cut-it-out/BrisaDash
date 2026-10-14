import * as THREE from 'three';
import { CONFIG } from '../game/config.js';
import { lanePosition } from '../game/lanes.js';
import { runMeter } from '../game/run.js';
import { bakeModel, instancedModel, normalise, paintByUv, painted, primitiveModel } from './models.js';
import { PALETTE } from './palette.js';

const RUNNER_HEIGHT = 1.5; // (tune)
const CUP_HEIGHT = 0.3; // (tune) the Kenney mug is squat: about 0.45 wide at this height
const FRAPPE_HEIGHT = 0.8; // (tune) tall and thin: about 0.36 wide
const TAKEAWAY_HEIGHT = 0.58; // (tune) about 0.4 wide
const PLANTER_HEIGHT = 0.6; // (tune) about 1.3 wide and 1 deep
const BOB_HEIGHT = 0.12; // (tune)
const BOB_STEPS_PER_SECOND = 5; // (tune)
const WOBBLE_ANGLE = 0.3; // radians at a full stumble meter (tune)
const WOBBLE_SPEED = 18;

const KNOCK_SECONDS = 0.4;
const KNOCK_DISTANCE = 1.8; // slides out of the lane
const KNOCK_TILT = 1.2; // tips over

const CUP_HOVER = 0.45;
const CUP_BOB = 0.08;

const MAX_OBSTACLES = 24; // per look
const MAX_COFFEES = 48;

const middle = Math.floor(CONFIG.laneCount / 2);
const laneX = (lane) => (lane - middle) * CONFIG.laneWidth;

// The barista: Kenney character-f in its static pose, or a block if the model didn't load.
// Bob and wobble move the whole static model; there is no rig or animation system (GDD §4).
export function createRunner(scene, model) {
  const runner = new THREE.Group();
  if (model) {
    const body = normalise(model, RUNNER_HEIGHT);
    body.rotation.y = Math.PI; // the model faces the camera; turn it to run down the track
    runner.add(body);
  } else {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, RUNNER_HEIGHT, 0.45),
      new THREE.MeshLambertMaterial({ color: PALETTE.deepOcean }),
    );
    block.position.y = RUNNER_HEIGHT / 2;
    runner.add(block);
  }
  scene.add(runner);

  function update(run, timeSeconds) {
    runner.position.x = (lanePosition(run.lanes) - middle) * CONFIG.laneWidth;
    if (run.over) {
      runner.position.y = 0;
      runner.rotation.z = 0.35;
      return;
    }
    runner.position.y = Math.abs(Math.sin(timeSeconds * Math.PI * BOB_STEPS_PER_SECOND)) * BOB_HEIGHT;
    // Stumble wobble: a code-driven tilt that fades as the meter drains (GDD §4)
    runner.rotation.z = Math.sin(timeSeconds * WOBBLE_SPEED) * WOBBLE_ANGLE * runMeter(run);
  }

  // The pop label is placed relative to this point (feet at y = 0)
  return { update, position: runner.position, height: RUNNER_HEIGHT };
}

// Obstacle from primitives: a parasol over a lounger (no pack has one, GDD §7)
function parasolModel() {
  return primitiveModel([
    painted(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6).translate(0, 1.0, 0), PALETTE.seaSaltWhite),
    painted(new THREE.ConeGeometry(0.85, 0.45, 8).translate(0, 2.1, 0), PALETTE.brisaTurquoise),
    painted(new THREE.BoxGeometry(0.6, 0.3, 1.0).translate(0, 0.15, 0.1), PALETTE.seaSaltWhite),
    painted(new THREE.BoxGeometry(0.6, 0.08, 0.6).rotateX(-0.9).translate(0, 0.5, -0.45), PALETTE.seaSaltWhite),
  ]);
}

// A deckchair from primitives, facing the runner: a white frame and a turquoise and white striped canvas
// sloping from the top of the back (behind) down to the front bar, about 1 m tall and 1 m wide
function deckchairModel() {
  const slope = 0.615; // radians: the canvas drops 0.6 m over 0.85 m towards the runner
  const canvasStripe = (x, color) =>
    painted(new THREE.BoxGeometry(0.3, 0.03, 1.04).rotateX(slope).translate(x, 0.7, -0.075), color);
  const rail = (x) => painted(new THREE.BoxGeometry(0.05, 0.05, 1.1).rotateX(slope).translate(x, 0.7, -0.075), PALETTE.seaSaltWhite);
  const frontLeg = (x) => painted(new THREE.BoxGeometry(0.05, 0.42, 0.05).translate(x, 0.21, 0.38), PALETTE.seaSaltWhite);
  const backLeg = (x) => painted(new THREE.BoxGeometry(0.05, 1.03, 0.05).rotateX(0.245).translate(x, 0.5, -0.625), PALETTE.seaSaltWhite);
  return primitiveModel([
    canvasStripe(-0.3, PALETTE.brisaTurquoise),
    canvasStripe(0, PALETTE.seaSaltWhite),
    canvasStripe(0.3, PALETTE.brisaTurquoise),
    ...[-0.47, 0.47].flatMap((x) => [rail(x), frontLeg(x), backLeg(x)]),
    painted(new THREE.BoxGeometry(0.99, 0.05, 0.05).translate(0, 0.42, 0.38), PALETTE.seaSaltWhite), // front bar
  ]);
}

// Obstacles (GDD §7): three looks that all hit the same way, picked per obstacle by config.obstacleMix.
// The parasol and the deckchair are built in code; the promenade planter (City Kit Suburban) falls back
// to the parasol if its model didn't load. One InstancedMesh per look. None of them is coral: coral means a cup.
export function createObstacles(scene, models) {
  const meshes = {
    parasol: instancedModel(scene, parasolModel(), MAX_OBSTACLES),
    deckchair: instancedModel(scene, deckchairModel(), MAX_OBSTACLES),
    planter: instancedModel(scene, models.planter ? bakeModel(models.planter, PLANTER_HEIGHT) : parasolModel(), MAX_OBSTACLES),
  };
  const knockStarted = new WeakMap(); // obstacle → render time its knock-aside began
  const dummy = new THREE.Object3D();

  function update(run, timeSeconds) {
    const counts = Object.fromEntries(Object.keys(meshes).map((kind) => [kind, 0]));
    for (const obstacle of run.obstacles) {
      const kind = meshes[obstacle.kind] ? obstacle.kind : 'parasol';
      if (counts[kind] === MAX_OBSTACLES) continue;
      dummy.position.set(laneX(obstacle.lane), 0, run.distance - obstacle.at);
      dummy.rotation.set(0, 0, 0);
      if (obstacle.knocked) {
        if (!knockStarted.has(obstacle)) knockStarted.set(obstacle, timeSeconds);
        const t = Math.min((timeSeconds - knockStarted.get(obstacle)) / KNOCK_SECONDS, 1);
        const dir = obstacle.lane < middle ? -1 : 1; // outer lanes tip outwards, the middle tips right
        dummy.position.x += dir * t * KNOCK_DISTANCE;
        dummy.rotation.z = -dir * t * KNOCK_TILT;
      }
      dummy.updateMatrix();
      meshes[kind].setMatrixAt(counts[kind]++, dummy.matrix);
    }
    for (const kind of Object.keys(meshes)) {
      meshes[kind].count = counts[kind];
      meshes[kind].instanceMatrix.needsUpdate = true;
    }
  }

  return { update };
}

// Primitive coral cup with a white lid, used if a cup model didn't load
function primitiveCup() {
  return primitiveModel([
    painted(new THREE.CylinderGeometry(0.2, 0.15, 0.45, 10).translate(0, 0.225, 0), PALETTE.sunsetCoral),
    painted(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 10).translate(0, 0.48, 0), PALETTE.seaSaltWhite),
  ]);
}

// Pickups (GDD §7): Kenney cup-coffee.glb tinted Sunset Coral (the tint multiplies the mostly white texture),
// the CC BY takeaway cup recoloured to the palette (Sunset Coral body, Sea Salt White lid),
// and the rarer frappe.glb in its own colours. One InstancedMesh per kind.
export function createCoffees(scene, models) {
  const mug = models.cup ? bakeModel(models.cup, CUP_HEIGHT) : primitiveCup();
  if (models.cup) for (const material of mug.materials) material.color.set(PALETTE.sunsetCoral);
  const meshes = {
    coffee: instancedModel(scene, mug, MAX_COFFEES),
    frappe: instancedModel(scene, models.frappe ? bakeModel(models.frappe, FRAPPE_HEIGHT) : primitiveCup(), MAX_COFFEES),
    takeaway: instancedModel(
      scene,
      models.takeaway
        ? paintByUv(bakeModel(models.takeaway, TAKEAWAY_HEIGHT), 0.5, PALETTE.seaSaltWhite, PALETTE.sunsetCoral)
        : primitiveCup(),
      MAX_COFFEES,
    ),
  };
  const dummy = new THREE.Object3D();

  function update(run, timeSeconds) {
    const counts = { coffee: 0, frappe: 0, takeaway: 0 };
    for (const coffee of run.coffees) {
      const mesh = meshes[coffee.kind];
      if (counts[coffee.kind] === MAX_COFFEES) continue;
      const phase = timeSeconds * 3 + coffee.at;
      dummy.position.set(laneX(coffee.lane), CUP_HOVER + Math.sin(phase) * CUP_BOB, run.distance - coffee.at);
      dummy.rotation.set(0, phase, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(counts[coffee.kind]++, dummy.matrix);
    }
    for (const kind of Object.keys(meshes)) {
      meshes[kind].count = counts[kind];
      meshes[kind].instanceMatrix.needsUpdate = true;
    }
  }

  return { update };
}
