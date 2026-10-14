// Swipes fire once the finger has moved thresholdPx sideways, before it lifts (GDD §3).
// One move per gesture; the next touch re-arms it. Arrow keys and A/D do the same on desktop.
export function bindInput(element, thresholdPx, onMove) {
  let pointerId = null;
  let startX = 0;

  element.addEventListener('pointerdown', (event) => {
    if (pointerId !== null) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    element.setPointerCapture(event.pointerId); // a mouse released outside the column still ends the gesture
  });

  element.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) >= thresholdPx) {
      onMove(Math.sign(dx));
      pointerId = null; // fired; wait for the next touch
    }
  });

  const endGesture = (event) => {
    if (event.pointerId === pointerId) pointerId = null;
  };
  element.addEventListener('pointerup', endGesture);
  element.addEventListener('pointercancel', endGesture);

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') onMove(-1);
    if (key === 'arrowright' || key === 'd') onMove(1);
  });
}
