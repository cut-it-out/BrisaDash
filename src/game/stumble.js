// The stumble fail rule (GDD §4): steady → stumbling → steady again when the meter runs out,
// or dead if hit again while stumbling.

export function createStumble() {
  return { mode: 'steady', timeLeft: 0 };
}

// Returns 'stumble' or 'dead'
export function hitStumble(stumble, seconds) {
  if (stumble.mode === 'steady') {
    stumble.mode = 'stumbling';
    stumble.timeLeft = seconds;
    return 'stumble';
  }
  stumble.mode = 'dead';
  return 'dead';
}

export function updateStumble(stumble, dt) {
  if (stumble.mode !== 'stumbling') return;
  stumble.timeLeft -= dt;
  if (stumble.timeLeft <= 0) {
    stumble.mode = 'steady';
    stumble.timeLeft = 0;
  }
}

// 1 just after a hit, draining to 0; 0 when not stumbling
export function stumbleMeter(stumble, seconds) {
  return stumble.mode === 'stumbling' ? stumble.timeLeft / seconds : 0;
}
