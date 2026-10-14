// HTML overlays on top of the canvas. Phase 2: gesture hint, HUD, "+10" pop and a temporary run-over panel.
// Start, game over and credits screens arrive in Phase 3.

export function showGestureHint(overlay) {
  const hint = document.createElement('div');
  hint.className = 'gesture-hint';
  hint.innerHTML = '<span class="gesture-hand" aria-hidden="true">👆</span><span>Swipe to change lanes</span>';
  overlay.append(hint);
  return () => hint.remove();
}

// Score at top centre, coffee count, and the stumble meter shown only while stumbling (GDD §8)
export function createHud(overlay) {
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <div class="hud-score">0</div>
    <div class="hud-coffee">☕ <span>0</span></div>
    <div class="hud-meter" hidden><div class="hud-meter-fill"></div></div>`;
  overlay.append(hud);
  const scoreEl = hud.querySelector('.hud-score');
  const coffeeEl = hud.querySelector('.hud-coffee span');
  const meterEl = hud.querySelector('.hud-meter');
  const fillEl = hud.querySelector('.hud-meter-fill');
  let shown = { score: 0, coffees: 0 };

  function update(score, coffees, meter) {
    if (score !== shown.score) scoreEl.textContent = score;
    if (coffees !== shown.coffees) coffeeEl.textContent = coffees;
    shown = { score, coffees };
    meterEl.hidden = meter <= 0;
    if (meter > 0) fillEl.style.width = `${meter * 100}%`;
  }

  return { update };
}

// A small floating label, e.g. "+10" above the runner; x and y are fractions of the overlay size
export function showPop(overlay, text, x, y) {
  const pop = document.createElement('div');
  pop.className = 'pop';
  pop.textContent = text;
  pop.style.left = `${x * 100}%`;
  pop.style.top = `${y * 100}%`;
  pop.addEventListener('animationend', () => pop.remove());
  overlay.append(pop);
}

// Temporary until the Phase 3 game-over screen
export function showRunOver(overlay, score, metres, coffees) {
  const panel = document.createElement('div');
  panel.className = 'run-over';
  panel.innerHTML = `
    <strong>Run over</strong>
    <span>Score ${score} · ${metres} m · ☕ ${coffees}</span>
    <small>Tap or press R to run again</small>`;
  overlay.append(panel);
  return () => panel.remove();
}
