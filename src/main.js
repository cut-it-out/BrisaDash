import './style.css';
import { CONFIG } from './game/config.js';
import { createLaneState, requestLaneMove, updateLanes } from './game/lanes.js';
import { createRunner } from './render/entities.js';
import { createScene, hasWebGL2 } from './render/scene.js';
import { createWorld } from './render/world.js';
import { createDebugOverlay } from './ui/debug.js';
import { bindInput } from './ui/input.js';
import { showGestureHint } from './ui/screens.js';

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
  const lanes = createLaneState(CONFIG.laneCount);
  const debug = createDebugOverlay(overlay);

  let hideHint = showGestureHint(overlay);
  bindInput(game, CONFIG.swipeThresholdPx, (dir) => {
    if (requestLaneMove(lanes, dir) && hideHint) {
      hideHint();
      hideHint = null;
    }
  });

  let distance = 0;
  let lastMs = performance.now();
  renderer.setAnimationLoop((nowMs) => {
    const dt = Math.min((nowMs - lastMs) / 1000, CONFIG.maxFrameSeconds);
    lastMs = nowMs;

    updateLanes(lanes, dt, CONFIG.laneSlideSeconds);
    distance += CONFIG.startSpeed * dt;
    world.update(distance);
    runner.update(lanes, nowMs / 1000);

    renderer.render(scene, camera);
    debug?.update(dt, renderer.info.render.calls);
  });
}
