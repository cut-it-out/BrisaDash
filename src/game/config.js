// Every (tune) number from docs/GDD.md in one place. Distances are in metres, times in seconds.
export const CONFIG = {
  // Lanes and controls (GDD §3)
  laneCount: 3,
  laneWidth: 1.5,
  laneSlideSeconds: 0.12,
  swipeThresholdPx: 30,

  // Speed (GDD §5); acceleration and cap arrive with Phase 2
  startSpeed: 8,

  // Stumble (GDD §4)
  stumbleSeconds: 5,
  stumbleSpeedFactor: 0.7,

  // Scoring (GDD §6)
  pointsPerMetre: 1,
  pointsPerCoffee: 10,

  // Rendering
  maxPixelRatio: 2,
  maxFrameSeconds: 0.1, // clamps dt after a stall so nothing jumps
};
