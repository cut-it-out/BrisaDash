// One run's state. updateRun advances it by dt and returns what happened, for the renderer and UI.
import { touchesRunner } from './collision.js';
import { createLaneState, effectiveLane, updateLanes } from './lanes.js';
import { score } from './score.js';
import { createSpawner, spawnUntil } from './spawner.js';
import { baseSpeed, stumbleSpeedFactor } from './speed.js';
import { createStumble, hitStumble, stumbleMeter, updateStumble } from './stumble.js';

export function createRun(config, rng) {
  return {
    config,
    rng,
    elapsed: 0,
    distance: 0,
    speed: config.startSpeed,
    lanes: createLaneState(config.laneCount),
    stumble: createStumble(),
    spawner: createSpawner(config),
    obstacles: [],
    coffees: [],
    coffeeCount: 0,
    over: false,
  };
}

export function runMeter(run) {
  return stumbleMeter(run.stumble, run.config.stumbleSeconds);
}

export function runScore(run) {
  return score(run.distance, run.coffeeCount, run.config);
}

// Returns events: { type: 'coffee' | 'stumble' | 'gameOver', lane }
export function updateRun(run, dt) {
  const events = [];
  if (run.over) return events;
  const config = run.config;

  run.elapsed += dt;
  updateLanes(run.lanes, dt, config.laneSlideSeconds);
  updateStumble(run.stumble, dt);
  run.speed = baseSpeed(run.elapsed, config) * stumbleSpeedFactor(runMeter(run), config);
  const prevDistance = run.distance;
  run.distance += run.speed * dt;

  spawnUntil(run.spawner, run.distance + config.spawnAhead, run.speed, run.rng, config, run.obstacles, run.coffees);

  const lane = effectiveLane(run.lanes);
  for (const obstacle of run.obstacles) {
    if (obstacle.knocked || !touchesRunner(obstacle, lane, prevDistance, run.distance, config.hitDepth)) continue;
    obstacle.knocked = true; // knocked aside, so it can't hit twice
    if (hitStumble(run.stumble, config.stumbleSeconds) === 'dead') {
      run.over = true;
      events.push({ type: 'gameOver', lane });
      break;
    }
    events.push({ type: 'stumble', lane });
  }

  for (const coffee of run.coffees) {
    if (coffee.collected || !touchesRunner(coffee, lane, prevDistance, run.distance, config.pickupDepth)) continue;
    coffee.collected = true;
    run.coffeeCount++;
    events.push({ type: 'coffee', lane });
  }

  const behind = run.distance - config.despawnBehind;
  run.obstacles = run.obstacles.filter((o) => o.at > behind);
  run.coffees = run.coffees.filter((c) => c.at > behind && !c.collected);

  return events;
}
