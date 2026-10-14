// Distance plus pickup points (GDD §6)
export function score(distance, pickupPoints, config) {
  return Math.floor(distance * config.pointsPerMetre) + pickupPoints;
}

// A frappe is worth more than a coffee mug
export function pickupValue(kind, config) {
  return kind === 'frappe' ? config.pointsPerFrappe : config.pointsPerCoffee;
}
