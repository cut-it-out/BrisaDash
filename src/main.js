import './style.css';
import * as THREE from 'three';
import credits from './credits.json';
import { CONFIG } from './game/config.js';
import { requestLaneMove } from './game/lanes.js';
import { applyOverrides } from './game/overrides.js';
import { createRun, runMeter, runScore, updateRun } from './game/run.js';
import { createCoffees, createObstacles, createRunner } from './render/entities.js';
import { loadModels } from './render/models.js';
import { createCameraShake, createScene, hasWebGL2 } from './render/scene.js';
import { createScenery, createWorld } from './render/world.js';
import { loadBest, recordScore } from './ui/best.js';
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

// Before anything reads CONFIG: ?debug&key=value overrides for balancing on the phone
const overrides = applyOverrides(CONFIG, new URLSearchParams(location.search));

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
  const shake = createCameraShake(camera);
  const debug = createDebugOverlay(overlay, overrides);

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
  let best = loadBest();
  startScreen.setBest(best);
  startScreen.show(); // Play stays disabled until the models have loaded

  const models = await loadModels();
  const scenery = createScenery(scene, models);
  const runner = createRunner(scene, models.runner);
  const obstacles = createObstacles(scene);
  const coffees = createCoffees(scene, models);
  startScreen.setReady();

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
    popPoint.set(runner.position.x, runner.position.y + runner.height + 0.3, runner.position.z).project(camera);
    showPop(overlay, text, (popPoint.x + 1) / 2, (1 - popPoint.y) / 2);
  }

  let lastMs = performance.now();
  renderer.setAnimationLoop((nowMs) => {
    const dt = Math.min((nowMs - lastMs) / 1000, CONFIG.maxFrameSeconds);
    lastMs = nowMs;
    const timeSeconds = nowMs / 1000;

    if (state === 'playing') {
      for (const event of updateRun(run, dt)) {
        if (event.type === 'coffee') popAboveRunner(`+${event.points}`);
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
        const score = runScore(run);
        const newBest = best > 0 && score > best; // a first run just sets the best
        best = recordScore(score, best);
        gameOverScreen.show(score, Math.floor(run.distance), run.coffeeCount, best, newBest);
      }
    }

    world.update(run.distance);
    scenery.update(run.distance);
    runner.update(run, timeSeconds);
    obstacles.update(run, timeSeconds);
    coffees.update(run, timeSeconds);
    shake.update(dt);
    hud.update(runScore(run), run.coffeeCount, runMeter(run));

    renderer.render(scene, camera);
    debug?.update(dt, renderer.info.render.calls);
  });
}
