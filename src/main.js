import './style.css';
import * as THREE from 'three';
import credits from './credits.json';
import { CONFIG } from './game/config.js';
import { requestLaneMove } from './game/lanes.js';
import { createRun, runMeter, runScore, updateRun } from './game/run.js';
import { createCoffees, createObstacles, createRunner } from './render/entities.js';
import { createCameraShake, createScene, hasWebGL2 } from './render/scene.js';
import { createWorld } from './render/world.js';
import { createDebugOverlay } from './ui/debug.js';
import { bindInput } from './ui/input.js';
import {
  createCreditsScreen,
  createGameOverScreen,
  createHud,
  createPauseScreen,
  createStartScreen,
  showGestureHint,
  showPop,
} from './ui/screens.js';
import { shareScore, shareText } from './ui/share.js';

const GAME_OVER_DELAY_SECONDS = 0.7; // lets the final knock-over read before the panel covers it (tune)

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
  const debug = createDebugOverlay(overlay);

  // 'start' → 'playing' ⇄ 'paused'; 'playing' → 'over' → 'playing' (Retry)
  let state = 'start';
  let run = createRun(CONFIG, Math.random);
  let overSeconds = 0; // time since the run ended
  let hideHint = null;
  let learnedSwipe = false; // the hint shows each run until the first successful lane change (GDD §3)

  const hud = createHud(overlay);
  const creditsScreen = createCreditsScreen(overlay, credits);
  const startScreen = createStartScreen(overlay, { onPlay: startRun, onCredits: creditsScreen.show });
  const gameOverScreen = createGameOverScreen(overlay, {
    onRetry: startRun,
    onShare: share,
    onCredits: creditsScreen.show,
  });
  const pauseScreen = createPauseScreen(overlay, { onResume: resume });
  startScreen.show();

  function startRun() {
    run = createRun(CONFIG, Math.random);
    state = 'playing';
    startScreen.hide();
    gameOverScreen.hide();
    hud.show();
    if (!learnedSwipe) hideHint = showGestureHint(overlay);
  }

  function resume() {
    state = 'playing';
    pauseScreen.hide();
  }

  async function share() {
    const metres = Math.floor(run.distance);
    const text = shareText(runScore(run), metres, run.coffeeCount);
    const result = await shareScore(text, `${location.origin}/`);
    if (result === 'copied') gameOverScreen.flashShareLabel('Copied!');
    if (result === 'failed') gameOverScreen.flashShareLabel("Couldn't share");
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') {
      state = 'paused';
      pauseScreen.show();
    }
  });

  bindInput(canvas, CONFIG.swipeThresholdPx, (dir) => {
    if (state !== 'playing') return;
    if (requestLaneMove(run.lanes, dir) && !learnedSwipe) {
      learnedSwipe = true;
      hideHint?.();
      hideHint = null;
    }
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

    if (state === 'playing') {
      for (const event of updateRun(run, dt)) {
        if (event.type === 'coffee') popAboveRunner(`+${CONFIG.pointsPerCoffee}`);
        if (event.type === 'stumble') shake.start();
        if (event.type === 'gameOver') {
          shake.start();
          state = 'over';
          overSeconds = 0;
          hideHint?.();
          hideHint = null;
        }
      }
    } else if (state === 'over' && overSeconds < GAME_OVER_DELAY_SECONDS) {
      overSeconds += dt;
      if (overSeconds >= GAME_OVER_DELAY_SECONDS) {
        hud.hide();
        gameOverScreen.show(runScore(run), Math.floor(run.distance), run.coffeeCount);
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
