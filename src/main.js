import './style.css';
import { createScene, hasWebGL2 } from './render/scene.js';

const canvas = document.getElementById('scene');
const overlay = document.getElementById('overlay');

if (!hasWebGL2()) {
  const message = document.createElement('p');
  message.className = 'message';
  message.textContent = "Sorry, this browser can't run Brisa Dash. It needs WebGL2.";
  overlay.append(message);
} else {
  const { renderer, scene, camera, cube } = createScene(canvas);
  renderer.setAnimationLoop((timeMs) => {
    cube.rotation.x = timeMs * 0.0005;
    cube.rotation.y = timeMs * 0.0008;
    renderer.render(scene, camera);
  });
}
