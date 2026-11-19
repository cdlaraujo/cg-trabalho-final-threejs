import { Config } from './Config.js';
import { Input, HUD } from './UI.js';
import { CameraManager } from './CameraManager.js';
import { LevelMap } from './LevelMap.js';
import { Player } from './Player.js';
import { Guardian } from './Guardian.js';

Input.init();
const scene = new THREE.Scene();
scene.background = new THREE.Color(Config.COLORS.background);
scene.fog = new THREE.FogExp2(Config.COLORS.fog, Config.LIGHTS.fogDensity);

// Iluminação global (substitui LightManager.js)
const { ambient, hemi, moon } = Config.LIGHTS;
scene.add(new THREE.AmbientLight(ambient.color, ambient.intensity));
scene.add(new THREE.HemisphereLight(hemi.sky, hemi.ground, hemi.intensity));
const moonLight = new THREE.DirectionalLight(moon.color, moon.intensity);
moonLight.position.set(...moon.pos);
scene.add(moonLight);

const camera = new THREE.PerspectiveCamera(
  Config.CAMERA.fov,
  window.innerWidth / window.innerHeight,
  Config.CAMERA.near,
  Config.CAMERA.far
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
if (Config.LIGHTS?.exposure) renderer.toneMappingExposure = Config.LIGHTS.exposure;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const level = new LevelMap(scene);
level.build();

const player = new Player(scene, level);
const guardian = new Guardian(scene, level, player);
const cameraManager = new CameraManager(camera, player, level);

let isGameOver = false;
const releasePointer = () => {
  if (document.pointerLockElement) document.exitPointerLock?.();
};

renderer.domElement.addEventListener('click', () => {
  if (!isGameOver && cameraManager.mode === 2 && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock?.();
  }
});

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (isGameOver) {
    if (key === 'r') location.reload();
    return;
  }

  if (key === 'c') {
    const mode = cameraManager.toggleMode();
    HUD.setCameraMode(mode);
    if (mode === 1) releasePointer();
  }
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = Math.min(clock.getDelta(), 0.1);

  const relicCollected = level.update(deltaTime, isGameOver ? null : player.group.position);

  if (!isGameOver) {
    player.update(deltaTime, cameraManager.mode);
    guardian.update(deltaTime);

    const distToGuardian = guardian.group.position.distanceTo(player.group.position);
    HUD.update(player, guardian.getState(), distToGuardian);

    if (relicCollected) {
      HUD.setScore(level.collectedRelics, level.totalRelics);
      guardian.onRelicCollected(level.collectedRelics);

      if (level.collectedRelics >= level.totalRelics) {
        isGameOver = true;
        releasePointer();
        HUD.showVictory();
      }
    }

    if (!isGameOver && distToGuardian < Config.GUARDIAN.catchRadius) {
      isGameOver = true;
      releasePointer();
      HUD.showGameOver();
    }
  }

  cameraManager.update();
  renderer.render(scene, camera);
}

animate();