const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

export function loadTexture(path, repeatX = 1, repeatY = 1) {
  const key = `${path}:${repeatX}:${repeatY}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const tex = textureLoader.load(path);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  textureCache.set(key, tex);
  return tex;
}

export function updateTorchFlicker(light, flame, baseIntensity, timer, phase = 0, amp = 0.2) {
  const wave = Math.sin(timer + phase) * amp + Math.cos(timer * 2.5 + phase) * (amp * 0.55);
  light.intensity = baseIntensity + wave;
  const scale = 1 + wave * 0.35;
  flame.scale.set(scale, scale * 1.28, scale);
}

export class Entity {
  constructor(scene, levelMap, startCell) {
    this.scene = scene;
    this.level = levelMap;
    this.group = new THREE.Group();
    this.group.position.copy(this.level.cellToWorld(startCell.r, startCell.c));
    this.scene.add(this.group);
  }

  addMesh(geo, mat, parent = this.group, pos = [0, 0, 0], castShadow = true) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.castShadow = mesh.receiveShadow = castShadow;
    parent.add(mesh);
    return mesh;
  }
}