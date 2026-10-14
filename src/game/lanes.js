// Lane state for the runner (GDD §3, §4). Lanes are numbered 0 (left) to laneCount - 1 (right).
// A move slides from `from` to `to`; one extra move made during a slide is queued.

export function createLaneState(laneCount) {
  const middle = Math.floor(laneCount / 2);
  return { laneCount, from: middle, to: middle, progress: 1, queued: 0 };
}

export function isSliding(state) {
  return state.progress < 1;
}

// During a slide the runner counts as being in the lane it is moving into (GDD §4)
export function effectiveLane(state) {
  return state.to;
}

function isValidLane(state, lane) {
  return lane >= 0 && lane < state.laneCount;
}

// dir is -1 (left) or +1 (right). Returns true if the move started or was queued.
export function requestLaneMove(state, dir) {
  if (isSliding(state)) {
    if (state.queued !== 0 || !isValidLane(state, state.to + dir)) return false;
    state.queued = dir;
    return true;
  }
  if (!isValidLane(state, state.to + dir)) return false;
  state.from = state.to;
  state.to += dir;
  state.progress = 0;
  return true;
}

export function updateLanes(state, dt, slideSeconds) {
  if (!isSliding(state)) return;
  state.progress = Math.min(1, state.progress + dt / slideSeconds);
  if (state.progress === 1) {
    state.from = state.to;
    if (state.queued !== 0) {
      const dir = state.queued;
      state.queued = 0;
      requestLaneMove(state, dir);
    }
  }
}

// Fractional lane index for drawing, eased so the slide starts quickly and settles gently
export function lanePosition(state) {
  const t = state.progress;
  const eased = 1 - (1 - t) * (1 - t);
  return state.from + (state.to - state.from) * eased;
}
