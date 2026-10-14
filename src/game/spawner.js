// Obstacle rows and coffee lines (GDD §7). Every row leaves at least one lane free.
// Some rows come as a zigzag pair: two two-lane rows close together whose free lanes are neighbours,
// so the runner has to swipe straight after the first row (the second arrangement, Phase 6).
// Coffee lines sit in a lane that is free in the row they lead into, between that row and the one before.
// Each line is one kind of cup, picked by config.cupLineMix; each obstacle's look is picked by config.obstacleMix.
// rng is a function returning [0, 1), injected so tests are repeatable.

export function createSpawner(config) {
  return { nextRowAt: config.firstRowAt, lastRowAt: 0 };
}

// Metres between rows: grows with speed, but slower than speed does, so rows come more often as the run goes on
export function rowGap(speed, config) {
  const gap = config.rowGapStart + (speed - config.startSpeed) * config.rowGapGrowth;
  return Math.max(gap, speed * config.rowGapMinSeconds);
}

function shuffledLanes(laneCount, rng) {
  const lanes = [...Array(laneCount).keys()];
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  return lanes;
}

// Shares are relative, so the mix needn't add up to 1 (e.g. after overriding one share from the URL)
export function pickKind(rng, mix) {
  const total = Object.values(mix).reduce((sum, share) => sum + share, 0);
  let roll = rng() * total;
  for (const [kind, share] of Object.entries(mix)) {
    roll -= share;
    if (roll < 0) return kind;
  }
  return Object.keys(mix)[0]; // only reached through rounding
}

// lanes is an ordering of every lane: the first blockedCount get obstacles, the rest stay free
function placeRow(at, prevAt, lanes, blockedCount, rng, config, obstacles, coffees) {
  for (const lane of lanes.slice(0, blockedCount)) {
    obstacles.push({ lane, at, kind: pickKind(rng, config.obstacleMix), knocked: false });
  }

  if (rng() >= config.coffeeLineChance) return;
  const freeLanes = lanes.slice(blockedCount);
  const lane = freeLanes[Math.floor(rng() * freeLanes.length)];
  const wanted = config.coffeeLineMin + Math.floor(rng() * (config.coffeeLineMax - config.coffeeLineMin + 1));
  const fits = Math.floor((at - prevAt - 2 * config.coffeeMargin) / config.coffeeSpacing) + 1;
  const count = Math.min(wanted, fits);
  if (count < config.coffeeLineMin) return;
  const kind = pickKind(rng, config.cupLineMix); // one kind per line
  for (let k = 0; k < count; k++) {
    coffees.push({ lane, at: at - config.coffeeMargin - k * config.coffeeSpacing, kind, collected: false });
  }
}

// The second row sits past the first row's hit window, plus zigzagRunSeconds of running, plus its own hit window
export function zigzagGap(speed, config) {
  return 2 * config.hitDepth + speed * config.zigzagRunSeconds;
}

// Returns where the last row of the arrangement went
function spawnArrangement(at, prevAt, speed, rng, config, obstacles, coffees) {
  const lanes = shuffledLanes(config.laneCount, rng);
  if (config.laneCount === 3 && rng() < config.zigzagChance) {
    const firstFree = lanes[2];
    const neighbours = [firstFree - 1, firstFree + 1].filter((lane) => lane >= 0 && lane < config.laneCount);
    const secondFree = neighbours[Math.floor(rng() * neighbours.length)];
    const secondAt = at + zigzagGap(speed, config);
    placeRow(at, prevAt, lanes, 2, rng, config, obstacles, coffees);
    const secondLanes = [0, 1, 2].filter((lane) => lane !== secondFree).concat(secondFree);
    placeRow(secondAt, at, secondLanes, 2, rng, config, obstacles, coffees);
    return secondAt;
  }
  const blockedCount = Math.min(rng() < config.twoBlockedChance ? 2 : 1, config.laneCount - 1);
  placeRow(at, prevAt, lanes, blockedCount, rng, config, obstacles, coffees);
  return at;
}

// Adds rows until the next one would be past `horizon`
export function spawnUntil(spawner, horizon, speed, rng, config, obstacles, coffees) {
  while (spawner.nextRowAt <= horizon) {
    spawner.lastRowAt = spawnArrangement(spawner.nextRowAt, spawner.lastRowAt, speed, rng, config, obstacles, coffees);
    spawner.nextRowAt = spawner.lastRowAt + rowGap(speed, config);
  }
}
