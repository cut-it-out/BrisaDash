// Shown only with ?debug in the URL: FPS and draw calls, for honest phone numbers.
const REFRESH_SECONDS = 0.5;

export function createDebugOverlay(overlay) {
  if (!new URLSearchParams(location.search).has('debug')) return null;
  const panel = document.createElement('div');
  panel.className = 'debug-panel';
  panel.textContent = 'measuring…';
  overlay.append(panel);

  let frames = 0;
  let elapsed = 0;

  function update(dt, drawCalls) {
    frames++;
    elapsed += dt;
    if (elapsed < REFRESH_SECONDS) return;
    panel.textContent = `${Math.round(frames / elapsed)} FPS · ${drawCalls} draw calls`;
    frames = 0;
    elapsed = 0;
  }

  return { update };
}
