// HTML overlays on top of the canvas (GDD §8). The overlay ignores pointer events;
// screens with buttons turn them back on (.screen), so taps there never reach the swipe input on the canvas.

function addElement(parent, className, html) {
  const element = document.createElement('div');
  element.className = className;
  element.innerHTML = html;
  parent.append(element);
  return element;
}

function screen(overlay, className, html) {
  const element = addElement(overlay, `screen ${className}`, html);
  element.hidden = true;
  return element;
}

export function showGestureHint(overlay) {
  const hint = addElement(
    overlay,
    'gesture-hint',
    '<span class="gesture-hand" aria-hidden="true">👆</span><span>Swipe to change lanes</span>',
  );
  return () => hint.remove();
}

export function createStartScreen(overlay, { onPlay, onCredits }) {
  const element = screen(
    overlay,
    'start-screen',
    `<h1 class="logo">Brisa <span>Dash</span></h1>
     <p class="tagline">by Brisa Café</p>
     <button class="button primary" data-action="play" disabled>Loading…</button>
     <button class="link" data-action="credits">Credits</button>`,
  );
  element.querySelector('[data-action="play"]').addEventListener('click', onPlay);
  element.querySelector('[data-action="credits"]').addEventListener('click', onCredits);
  const playButton = element.querySelector('[data-action="play"]');
  return {
    show() {
      element.hidden = false;
      playButton.focus({ preventScroll: true });
    },
    hide: () => (element.hidden = true),
    setReady() {
      playButton.disabled = false;
      playButton.textContent = 'Play';
      playButton.focus({ preventScroll: true });
    },
  };
}

// Score at top centre, coffee count, and the stumble meter shown only while stumbling
export function createHud(overlay) {
  const hud = addElement(
    overlay,
    'hud',
    `<div class="hud-score">0</div>
     <div class="hud-coffee">☕ <span>0</span></div>
     <div class="hud-meter" hidden><div class="hud-meter-fill"></div></div>`,
  );
  hud.hidden = true;
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

  return { update, show: () => (hud.hidden = false), hide: () => (hud.hidden = true) };
}

// A small floating label, e.g. "+10" above the runner; x and y are fractions of the overlay size
export function showPop(overlay, text, x, y) {
  const pop = addElement(overlay, 'pop', '');
  pop.textContent = text;
  pop.style.left = `${x * 100}%`;
  pop.style.top = `${y * 100}%`;
  pop.addEventListener('animationend', () => pop.remove());
}

export function createGameOverScreen(overlay, { onRetry, onShare, onCredits }) {
  const element = screen(
    overlay,
    'game-over-screen',
    `<div class="panel">
       <h2>Run over</h2>
       <div class="final-score"></div>
       <div class="final-stats"></div>
       <button class="button primary" data-action="retry">Retry</button>
       <button class="button secondary" data-action="share">Share score</button>
       <button class="link" data-action="credits">Credits</button>
     </div>`,
  );
  const shareButton = element.querySelector('[data-action="share"]');
  element.querySelector('[data-action="retry"]').addEventListener('click', onRetry);
  shareButton.addEventListener('click', onShare);
  element.querySelector('[data-action="credits"]').addEventListener('click', onCredits);
  let labelTimer = 0;

  return {
    show(score, metres, coffees) {
      element.querySelector('.final-score').textContent = score;
      element.querySelector('.final-stats').textContent = `${metres} m · ☕ ${coffees}`;
      shareButton.textContent = 'Share score';
      element.hidden = false;
      element.querySelector('[data-action="retry"]').focus({ preventScroll: true });
    },
    hide: () => (element.hidden = true),
    // Briefly swaps the Share button label, e.g. "Copied!"
    flashShareLabel(text) {
      clearTimeout(labelTimer);
      shareButton.textContent = text;
      labelTimer = setTimeout(() => (shareButton.textContent = 'Share score'), 2000);
    },
  };
}

export function createPauseScreen(overlay, { onResume }) {
  const element = screen(overlay, 'pause-screen', '<div class="panel"><h2>Paused</h2><p>Tap to resume</p></div>');
  element.addEventListener('click', onResume);
  return { show: () => (element.hidden = false), hide: () => (element.hidden = true) };
}

function escapeHtml(text) {
  const span = document.createElement('span');
  span.textContent = text;
  return span.innerHTML;
}

// Lists every third-party asset actually used, from src/credits.json (the same data as CREDITS.md)
export function createCreditsScreen(overlay, credits) {
  const assets = credits.assets.length
    ? credits.assets
        .map(
          (a) =>
            `<li><strong>${escapeHtml(a.pack)}</strong> by ${escapeHtml(a.creator)} (${escapeHtml(a.license)})<br>
             <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.url)}</a></li>`,
        )
        .join('')
    : '<li>No third-party assets yet: every shape is built in code.</li>';
  const element = screen(
    overlay,
    'credits-screen',
    `<div class="panel">
       <h2>Credits</h2>
       <ul>${assets}</ul>
       <p>Built with <a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> (MIT License).</p>
       <p class="disclaimer">Brisa Café is a fictional café made up for this prototype.</p>
       <button class="button secondary" data-action="close">Close</button>
     </div>`,
  );
  element.querySelector('[data-action="close"]').addEventListener('click', () => (element.hidden = true));
  return { show: () => (element.hidden = false) };
}
