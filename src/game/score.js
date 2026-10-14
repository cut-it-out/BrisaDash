// Distance plus a coffee bonus (GDD §6)
export function score(distance, coffees, config) {
  return Math.floor(distance * config.pointsPerMetre) + coffees * config.pointsPerCoffee;
}
