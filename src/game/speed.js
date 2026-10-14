// Speed ramps up to a cap (GDD §5)
export function baseSpeed(elapsedSeconds, config) {
  return Math.min(config.startSpeed + config.acceleration * elapsedSeconds, config.maxSpeed);
}

// meter is 1 just after a stumble and 0 when steady: speed drops to stumbleSpeedFactor and climbs back (GDD §4)
export function stumbleSpeedFactor(meter, config) {
  return 1 - (1 - config.stumbleSpeedFactor) * meter;
}
