// Every (tune) number from docs/GDD.md in one place. Distances are in metres, times in seconds.
export const CONFIG = {
  // Lanes and controls (GDD §3)
  laneCount: 3,
  laneWidth: 1.5,
  laneSlideSeconds: 0.12,
  swipeThresholdPx: 30,

  // Speed in m/s (GDD §5)
  startSpeed: 8,
  acceleration: 0.25,
  maxSpeed: 40,

  // Spawning (GDD §7)
  firstRowAt: 30, // empty track before the first row
  rowGapSeconds: 1.2, // rows are this many seconds apart at the current speed...
  minRowGap: 9, // ...but never closer than this
  twoBlockedChance: 0.55, // otherwise a row blocks one lane
  coffeeLineChance: 0.6,
  cupLineMix: { coffee: 0.4, takeaway: 0.4, frappe: 0.2 }, // share of cup lines of each kind (sums to 1)
  coffeeLineMin: 3,
  coffeeLineMax: 5,
  coffeeSpacing: 1.8,
  coffeeMargin: 2.5, // keeps cups this far from obstacle rows
  spawnAhead: 70, // spawn up to here; the fog ends at 75
  despawnBehind: 8, // the camera sits about 4.5 m behind the runner

  // Collision (GDD §4): a hit is the same lane and less than this far apart
  hitDepth: 0.8,
  pickupDepth: 0.8,

  // Stumble (GDD §4)
  stumbleSeconds: 5,
  stumbleSpeedFactor: 0.7,

  // Scoring (GDD §6)
  pointsPerMetre: 1,
  pointsPerCoffee: 10,
  pointsPerFrappe: 20,

  // Rendering
  maxPixelRatio: 2,
  maxFrameSeconds: 0.1, // clamps dt after a stall so nothing jumps
};
