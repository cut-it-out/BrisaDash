import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Kenney CC0 models plus one CC BY 4.0 model in public/models (credited in src/credits.json and CREDITS.md)
const MODEL_FILES = {
  runner: 'models/blocky/character-f.glb',
  cup: 'models/food/cup-coffee.glb',
  frappe: 'models/food/frappe.glb',
  takeaway: 'models/sketchfab/low-poly_takeaway_coffee_cup.glb',
  palm: 'models/nature/tree_palm.glb',
  palmBend: 'models/nature/tree_palmBend.glb',
  palmTall: 'models/nature/tree_palmTall.glb',
  rockSmall: 'models/nature/rock_smallA.glb',
  rockLarge: 'models/nature/rock_largeA.glb',
  stoneSmall: 'models/nature/stone_smallA.glb',
  stoneLarge: 'models/nature/stone_largeA.glb',
  stoneRound: 'models/nature/stone_smallH.glb',
  houseBungalow: 'models/city/building-type-g.glb',
  houseNarrow: 'models/city/building-type-k.glb',
  houseVilla: 'models/city/building-type-m.glb',
  houseBalcony: 'models/city/building-type-r.glb',
  boatSail: 'models/watercraft/boat-sail-a.glb',
  boatSpeed: 'models/watercraft/boat-speed-j.glb',
  boatFishing: 'models/watercraft/boat-fishing-small.glb',
  tent: 'models/nature/tent_smallClosed.glb',
  barrel: 'models/food/barrel.glb',
};

// Resolves to { name: THREE.Group | null }. A model that fails to load is null,
// and its entity falls back to the code-built placeholder.
export async function loadModels() {
  const loader = new GLTFLoader();
  // The takeaway cup lists this material extension as required; three.js dropped support for it.
  // Registering the name stops the warning; the cup is coloured in code instead (see paintByUv).
  loader.register(() => ({ name: 'KHR_materials_pbrSpecularGlossiness' }));
  const entries = await Promise.all(
    Object.entries(MODEL_FILES).map(async ([name, file]) => {
      try {
        const gltf = await loader.loadAsync(import.meta.env.BASE_URL + file);
        useFlatMaterials(gltf.scene);
        return [name, gltf.scene];
      } catch (error) {
        console.warn(`Model ${file} failed to load; using a placeholder`, error);
        return [name, null];
      }
    }),
  );
  return Object.fromEntries(entries);
}

// Kenney's GLBs use PBR materials, several with metalness 1 (or unset, which glTF treats as 1), and those
// render dark without an environment map. Lambert matches the rest of the flat-lit scene and is cheaper on phones.
function useFlatMaterials(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    const pbr = child.material;
    child.material = new THREE.MeshLambertMaterial({ name: pbr.name, color: pbr.color, map: pbr.map });
    pbr.dispose();
  });
}

// Scales a model to `height`, standing on y = 0 and centred on x/z
export function normalise(object, height) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const scale = height / size.y;
  const center = box.getCenter(new THREE.Vector3());
  object.scale.multiplyScalar(scale);
  object.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  const wrapper = new THREE.Group();
  wrapper.add(object);
  return wrapper;
}

// Bakes a model into one geometry (one group per mesh) so an InstancedMesh can draw every copy.
// GLTFLoader already gives each material its own mesh, so meshes and materials pair up one to one.
export function bakeModel(object, height) {
  const root = normalise(object, height);
  root.updateMatrixWorld(true);
  const geometries = [];
  const materials = [];
  root.traverse((child) => {
    if (!child.isMesh) return;
    geometries.push(child.geometry.clone().applyMatrix4(child.matrixWorld));
    materials.push(child.material);
  });
  // mergeGeometries needs the same attributes everywhere: keep only the shared ones
  const shared = Object.keys(geometries[0].attributes).filter((name) => geometries.every((g) => g.attributes[name]));
  for (const geometry of geometries) {
    for (const name of Object.keys(geometry.attributes)) if (!shared.includes(name)) geometry.deleteAttribute(name);
  }
  return { geometry: mergeGeometries(geometries, true), materials };
}

// Replaces a baked model's materials with flat vertex colours chosen by texture position:
// texels in the top half of the texture (v < split) get topColor, the rest bottomColor.
// glTF UVs start at the top-left of the image.
export function paintByUv(baked, split, topColor, bottomColor) {
  const uv = baked.geometry.attributes.uv;
  const colors = new Float32Array(uv.count * 3);
  const top = new THREE.Color(topColor);
  const bottom = new THREE.Color(bottomColor);
  for (let i = 0; i < uv.count; i++) (uv.getY(i) < split ? top : bottom).toArray(colors, i * 3);
  baked.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const flat = new THREE.MeshLambertMaterial({ vertexColors: true });
  return { geometry: baked.geometry, materials: baked.materials.map(() => flat) };
}

// Gives a geometry one flat vertex colour, so differently coloured parts can merge into one mesh
export function painted(geometry, color) {
  const rgb = new THREE.Color(color);
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) rgb.toArray(colors, i);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

// Code-built parts merged into one vertex-coloured geometry, for an InstancedMesh
export function primitiveModel(parts) {
  return { geometry: mergeGeometries(parts), materials: new THREE.MeshLambertMaterial({ vertexColors: true }) };
}

export function instancedModel(scene, baked, capacity) {
  const mesh = new THREE.InstancedMesh(baked.geometry, baked.materials, capacity);
  mesh.count = 0;
  mesh.frustumCulled = false; // instances move every frame; the default bounds would go stale
  scene.add(mesh);
  return mesh;
}
