// HTML overlays on top of the canvas. Phase 1: the gesture hint. Start, HUD and game over arrive in Phase 3.

export function showGestureHint(overlay) {
  const hint = document.createElement('div');
  hint.className = 'gesture-hint';
  hint.innerHTML = '<span class="gesture-hand" aria-hidden="true">👆</span><span>Swipe to change lanes</span>';
  overlay.append(hint);
  return () => hint.remove();
}
