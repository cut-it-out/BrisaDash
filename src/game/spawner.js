// Obstacle rows and coffee lines (GDD §7). Every row leaves at least one lane free.
// Coffee lines sit in a lane that is free in the row they lead into, between that row and the one before.
// rng is a function returning [0, 1), injected so tests are repeatable.

export function createSpawner(config) {
  return { nextRowAt: config.firstRowAt, lastRowAt: 0 };
}

export function rowGap(speed, config) {
  return Math.max(config.minRowGap, speed * config.rowGapSeconds);
}

function shuffledLanes(laneCount, rng) {
  const lanes = [...Array(laneCount).keys()];
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  return lanes;
}

function spawnRow(at, prevAt, rng, config, obstacles, coffees) {
  const lanes = shuffledLanes(config.laneCount, rng);
  const blockedCount = Math.min(rng() < config.twoBlockedChance ? 2 : 1, config.laneCount - 1);
  for (const lane of lanes.slice(0, blockedCount)) {
    obstacles.push({ lane, at, knocked: false });
  }

  if (rng() >= config.coffeeLineChance) return;
  const freeLanes = lanes.slice(blockedCount);
  const lane = freeLanes[Math.floor(rng() * freeLanes.length)];
  const wanted = config.coffeeLineMin + Math.floor(rng() * (config.coffeeLineMax - config.coffeeLineMin + 1));
  const fits = Math.floor((at - prevAt - 2 * config.coffeeMargin) / config.coffeeSpacing) + 1;
  const count = Math.min(wanted, fits);
  if (count < config.coffeeLineMin) return;
  for (let k = 0; k < count; k++) {
    coffees.push({ lane, at: at - config.coffeeMargin - k * config.coffeeSpacing, collected: false });
  }
}

// Adds rows until the next one would be past `horizon`
export function spawnUntil(spawner, horizon, speed, rng, config, obstacles, coffees) {
  while (spawner.nextRowAt <= horizon) {
    spawnRow(spawner.nextRowAt, spawner.lastRowAt, rng, config, obstacles, coffees);
    spawner.lastRowAt = spawner.nextRowAt;
    spawner.nextRowAt += rowGap(speed, config);
  }
}
