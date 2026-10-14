// Lane-plus-distance collision, no physics (GDD §4). Positions are metres along the track.
// Checks the whole step from prevDistance to distance, so a long frame can't skip over a hit.
export function touchesRunner(item, lane, prevDistance, distance, depth) {
  return item.lane === lane && item.at > prevDistance - depth && item.at < distance + depth;
}
