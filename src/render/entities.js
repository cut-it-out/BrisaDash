import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG } from '../game/config.js';
import { lanePosition } from '../game/lanes.js';
import { runMeter } from '../game/run.js';
import { PALETTE } from './palette.js';

const RUNNER_HEIGHT = 1.3;
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

// Placeholder runner (a block) until the Kenney character arrives in Phase 4
export function createRunner(scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, RUNNER_HEIGHT, 0.45),
    new THREE.MeshLambertMaterial({ color: PALETTE.deepOcean }),
  );
  scene.add(mesh);

  function update(run, timeSeconds) {
    mesh.position.x = (lanePosition(run.lanes) - middle) * CONFIG.laneWidth;
    if (run.over) {
      mesh.position.y = RUNNER_HEIGHT / 2;
      mesh.rotation.z = 0.35;
      return;
    }
    const bob = Math.abs(Math.sin(timeSeconds * Math.PI * BOB_STEPS_PER_SECOND)) * BOB_HEIGHT;
    mesh.position.y = RUNNER_HEIGHT / 2 + bob;
    // Stumble wobble: a code-driven tilt that fades as the meter drains (GDD §4)
    mesh.rotation.z = Math.sin(timeSeconds * WOBBLE_SPEED) * WOBBLE_ANGLE * runMeter(run);
  }

  return { update, position: mesh.position };
}

// Gives a geometry one flat vertex colour, so differently coloured parts can merge into one mesh
function painted(geometry, color) {
  const rgb = new THREE.Color(color);
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) rgb.toArray(colors, i);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

// One InstancedMesh draws every obstacle (or every cup) in a single draw call
function instancedModel(scene, parts, capacity) {
  const mesh = new THREE.InstancedMesh(
    mergeGeometries(parts),
    new THREE.MeshLambertMaterial({ vertexColors: true }),
    capacity,
  );
  mesh.count = 0;
  mesh.frustumCulled = false; // instances move every frame; the default bounds would go stale
  scene.add(mesh);
  return mesh;
}

// Placeholder obstacle from primitives: a parasol over a lounger (no pack has one, GDD §7)
export function createObstacles(scene) {
  const mesh = instancedModel(
    scene,
    [
      painted(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6).translate(0, 1.0, 0), PALETTE.seaSaltWhite),
      painted(new THREE.ConeGeometry(0.85, 0.45, 8).translate(0, 2.1, 0), PALETTE.brisaTurquoise),
      painted(new THREE.BoxGeometry(0.6, 0.3, 1.0).translate(0, 0.15, 0.1), PALETTE.seaSaltWhite),
      painted(new THREE.BoxGeometry(0.6, 0.08, 0.6).rotateX(-0.9).translate(0, 0.5, -0.45), PALETTE.seaSaltWhite),
    ],
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

// Placeholder coffee cup from primitives, Sunset Coral with a white lid; Phase 4 swaps in cup-coffee.glb
export function createCoffees(scene) {
  const mesh = instancedModel(
    scene,
    [
      painted(new THREE.CylinderGeometry(0.2, 0.15, 0.45, 10).translate(0, 0.225, 0), PALETTE.sunsetCoral),
      painted(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 10).translate(0, 0.48, 0), PALETTE.seaSaltWhite),
    ],
    MAX_COFFEES,
  );
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
