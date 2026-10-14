import './style.css';
import * as THREE from 'three';
import { CONFIG } from './game/config.js';
import { requestLaneMove } from './game/lanes.js';
import { createRun, runMeter, runScore, updateRun } from './game/run.js';
import { createCoffees, createObstacles, createRunner } from './render/entities.js';
import { createCameraShake, createScene, hasWebGL2 } from './render/scene.js';
import { createWorld } from './render/world.js';
import { createDebugOverlay } from './ui/debug.js';
import { bindInput } from './ui/input.js';
import { createHud, showGestureHint, showPop, showRunOver } from './ui/screens.js';

const game = document.getElementById('game');
const canvas = document.getElementById('scene');
const overlay = document.getElementById('overlay');

if (!hasWebGL2()) {
  const message = document.createElement('p');
  message.className = 'message';
  message.textContent = "Sorry, this browser can't run Brisa Dash. It needs WebGL2.";
  overlay.append(message);
} else {
  const { renderer, scene, camera } = createScene(canvas);
  const world = createWorld(scene);
  const runner = createRunner(scene);
  const obstacles = createObstacles(scene);
  const coffees = createCoffees(scene);
  const shake = createCameraShake(camera);
  const hud = createHud(overlay);
  const debug = createDebugOverlay(overlay);

  let run = createRun(CONFIG, Math.random);
  let hideRunOver = null;
  function restart() {
    run = createRun(CONFIG, Math.random);
    hideRunOver?.();
    hideRunOver = null;
  }

  let hideHint = showGestureHint(overlay);
  bindInput(game, CONFIG.swipeThresholdPx, (dir) => {
    if (run.over) return;
    if (requestLaneMove(run.lanes, dir) && hideHint) {
      hideHint();
      hideHint = null;
    }
  });
  // Phase 2 restart: tap after a run ends, or R at any time (debug). Phase 3 replaces this with Retry.
  game.addEventListener('pointerdown', () => {
    if (run.over) restart();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'r') restart();
  });

  const popPoint = new THREE.Vector3();
  function popAboveRunner(text) {
    popPoint.set(runner.position.x, runner.position.y + 1.2, runner.position.z).project(camera);
    showPop(overlay, text, (popPoint.x + 1) / 2, (1 - popPoint.y) / 2);
  }

  let lastMs = performance.now();
  renderer.setAnimationLoop((nowMs) => {
    const dt = Math.min((nowMs - lastMs) / 1000, CONFIG.maxFrameSeconds);
    lastMs = nowMs;
    const timeSeconds = nowMs / 1000;

    for (const event of updateRun(run, dt)) {
      if (event.type === 'coffee') popAboveRunner(`+${CONFIG.pointsPerCoffee}`);
      if (event.type === 'stumble') shake.start();
      if (event.type === 'gameOver') {
        shake.start();
        hideRunOver = showRunOver(overlay, runScore(run), Math.floor(run.distance), run.coffeeCount);
      }
    }

    world.update(run.distance);
    runner.update(run, timeSeconds);
    obstacles.update(run, timeSeconds);
    coffees.update(run, timeSeconds);
    shake.update(dt);
    hud.update(runScore(run), run.coffeeCount, runMeter(run));

    renderer.render(scene, camera);
    debug?.update(dt, renderer.info.render.calls);
  });
}
