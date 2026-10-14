import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG } from '../game/config.js';
import { lanePosition } from '../game/lanes.js';
import { runMeter } from '../game/run.js';
import { bakeModel, instancedModel, normalise } from './models.js';
import { PALETTE } from './palette.js';

const RUNNER_HEIGHT = 1.5; // (tune)
const CUP_HEIGHT = 0.4; // (tune) the Kenney mug is squat: about 0.6 wide at this height
const BOB_HEIGHT = 0.12; // (tune)
const BOB_STEPS_PER_SECOND = 5; // (tune)
const WOBBLE_ANGLE = 0.3; // radians at a full stumble meter (tune)
const WOBBLE_SPEED = 18;

const KNOCK_SECONDS = 0.4;
const KNOCK_DISTANCE = 1.8; // slides out of the lane
const KNOCK_TILT = 1.2; // tips over

const CUP_HOVER = 0.45;
const CUP_BOB = 0.08;

const MAX_OBSTACLES = 24;
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

// Gives a geometry one flat vertex colour, so differently coloured parts can merge into one mesh
function painted(geometry, color) {
  const rgb = new THREE.Color(color);
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) rgb.toArray(colors, i);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

// Code-built parts merged into one vertex-coloured geometry, for an InstancedMesh
function primitiveModel(parts) {
  return { geometry: mergeGeometries(parts), materials: new THREE.MeshLambertMaterial({ vertexColors: true }) };
}

// Obstacle from primitives: a parasol over a lounger (no pack has one, GDD §7)
export function createObstacles(scene) {
  const mesh = instancedModel(
    scene,
    primitiveModel([
      painted(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6).translate(0, 1.0, 0), PALETTE.seaSaltWhite),
      painted(new THREE.ConeGeometry(0.85, 0.45, 8).translate(0, 2.1, 0), PALETTE.brisaTurquoise),
      painted(new THREE.BoxGeometry(0.6, 0.3, 1.0).translate(0, 0.15, 0.1), PALETTE.seaSaltWhite),
      painted(new THREE.BoxGeometry(0.6, 0.08, 0.6).rotateX(-0.9).translate(0, 0.5, -0.45), PALETTE.seaSaltWhite),
    ]),
    MAX_OBSTACLES,
  );
  const knockStarted = new WeakMap(); // obstacle → render time its knock-aside began
  const dummy = new THREE.Object3D();

  function update(run, timeSeconds) {
    let i = 0;
    for (const obstacle of run.obstacles) {
      if (i === MAX_OBSTACLES) break;
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
      mesh.setMatrixAt(i++, dummy.matrix);
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
  }

  return { update };
}

// Coffee pickup: Kenney cup-coffee.glb, or a Sunset Coral primitive cup if the model didn't load
export function createCoffees(scene, model) {
  const baked = model
    ? bakeModel(model, CUP_HEIGHT)
    : primitiveModel([
        painted(new THREE.CylinderGeometry(0.2, 0.15, 0.45, 10).translate(0, 0.225, 0), PALETTE.sunsetCoral),
        painted(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 10).translate(0, 0.48, 0), PALETTE.seaSaltWhite),
      ]);
  const mesh = instancedModel(scene, baked, MAX_COFFEES);
  const dummy = new THREE.Object3D();

  function update(run, timeSeconds) {
    let i = 0;
    for (const coffee of run.coffees) {
      if (i === MAX_COFFEES) break;
      const phase = timeSeconds * 3 + coffee.at;
      dummy.position.set(laneX(coffee.lane), CUP_HOVER + Math.sin(phase) * CUP_BOB, run.distance - coffee.at);
      dummy.rotation.set(0, phase, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i++, dummy.matrix);
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
  }

  return { update };
}
