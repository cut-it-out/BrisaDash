// Shown only with ?debug in the URL: FPS and draw calls for honest phone numbers, plus any config overrides.
const REFRESH_SECONDS = 0.5;

export function createDebugOverlay(overlay, overrides = {}) {
  if (!new URLSearchParams(location.search).has('debug')) return null;
  const panel = document.createElement('div');
  panel.className = 'debug-panel';
  const stats = document.createElement('div');
  stats.textContent = 'measuring…';
  panel.append(stats);
  for (const [key, value] of Object.entries(overrides)) {
    const line = document.createElement('div');
    line.textContent = `${key} = ${value}`;
    panel.append(line);
  }
  overlay.append(panel);

  let frames = 0;
  let elapsed = 0;

  function update(dt, drawCalls) {
    frames++;
    elapsed += dt;
    if (elapsed < REFRESH_SECONDS) return;
    stats.textContent = `${Math.round(frames / elapsed)} FPS · ${drawCalls} draw calls`;
    frames = 0;
    elapsed = 0;
  }

  return { update };
}
