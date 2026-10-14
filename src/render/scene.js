import * as THREE from 'three';
import { CONFIG } from '../game/config.js';
import { PALETTE } from './palette.js';

export function hasWebGL2() {
  return !!document.createElement('canvas').getContext('webgl2');
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sky);
  scene.fog = new THREE.Fog(PALETTE.sky, 40, 75); // hides recycled objects appearing at the far end

  // Fixed camera behind and above the runner, looking down the track (GDD §7)
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
  camera.position.set(0, 4.0, 4.5);
  camera.lookAt(0, 0, -8);

  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(3, 6, 4);
  scene.add(sun);

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  return { renderer, scene, camera };
}

const SHAKE_SECONDS = 0.35; // (tune)
const SHAKE_AMOUNT = 0.12;

// The only camera motion (GDD §7): a small shake on a hit. The look direction stays steady.
export function createCameraShake(camera) {
  const base = camera.position.clone();
  let timeLeft = 0;

  function start() {
    timeLeft = SHAKE_SECONDS;
  }

  function update(dt) {
    if (timeLeft <= 0) return;
    timeLeft = Math.max(0, timeLeft - dt);
    const amount = (SHAKE_AMOUNT * timeLeft) / SHAKE_SECONDS;
    camera.position.set(
      base.x + (Math.random() * 2 - 1) * amount,
      base.y + (Math.random() * 2 - 1) * amount,
      base.z,
    );
  }

  return { start, update };
}
