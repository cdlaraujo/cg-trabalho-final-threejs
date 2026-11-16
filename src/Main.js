import { Config } from './Config.js';
import { Input } from './Input.js';
import { LightManager } from './LightManager.js';
import { CameraManager } from './CameraManager.js';
import { LevelMap } from './LevelMap.js';
import { Player } from './Player.js';
import { Guardian } from './Guardian.js';
import { RelicManager } from './RelicManager.js';

Input.init();
const scene = new THREE.Scene();
scene.background = new THREE.Color(Config.COLORS.background);
scene.fog = new THREE.FogExp2(Config.COLORS.fog, Config.LIGHTS.fogDensity);

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

const lightManager = new LightManager(scene);
const level = new LevelMap(scene);
level.build();

const player = new Player(scene, level);
const guardian = new Guardian(scene, level, player);
const relics = new RelicManager(scene, level, Config.RELICS.total);
const cameraManager = new CameraManager(camera, player, level);

// --- TRAVA DE MOUSE PARA A 1ª PESSOA ---
renderer.domElement.addEventListener('click', () => {
  if (!isGameOver && cameraManager.mode === 2 && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock?.();
  }
});

let isGameOver = false;
const uiCam = document.getElementById('ui-cam');
const uiScore = document.getElementById('ui-score');
const uiStaminaBar = document.getElementById('ui-stamina-bar');
const uiGuardianState = document.getElementById('ui-guardian-state');
const dangerVignette = document.getElementById('danger-vignette');

function updateHUD(distToGuardian) {
  const staminaPct = (player.stamina / Config.PLAYER.maxStamina) * 100;
  uiStaminaBar.style.width = `${staminaPct}%`;
  uiStaminaBar.style.backgroundColor = player.isExhausted ? '#e53e3e' : '#38b2ac';

  const state = guardian.getState();
  if (state === 'HUNT') {
    uiGuardianState.innerText = 'CAÇANDO VOCÊ!';
    uiGuardianState.className = 'state-hunt';
  } else if (state === 'SEARCH') {
    uiGuardianState.innerText = 'Procurando...';
    uiGuardianState.className = 'state-search';
  } else {
    uiGuardianState.innerText = 'Patrulhando';
    uiGuardianState.className = 'state-patrol';
  }

  const dangerStart = 14;
  if (distToGuardian < dangerStart) {
    const intensity = Math.max(0, Math.min(1, 1 - (distToGuardian - 2) / (dangerStart - 2)));
    dangerVignette.style.opacity = intensity.toFixed(2);
  } else {
    dangerVignette.style.opacity = '0';
  }
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (isGameOver) {
    if (key === 'r') location.reload();
    return;
  }

  if (key === 'c') {
    const mode = cameraManager.toggleMode();
    uiCam.innerText = mode === 1 ? 'Terceira Pessoa' : 'Primeira Pessoa';
    
    // Libera o mouse automaticamente ao sair da 1ª pessoa
    if (mode === 1 && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = Math.min(clock.getDelta(), 0.1);

  level.update(deltaTime);

  if (!isGameOver) {
    // IMPORTANTE: Passar o cameraMode para o player definir o tipo de movimento
    player.update(deltaTime, cameraManager.mode);
    guardian.update(deltaTime);

    const distToGuardian = guardian.group.position.distanceTo(player.group.position);
    updateHUD(distToGuardian);

    if (relics.update(deltaTime, player.group.position)) {
      uiScore.innerText = `${relics.collected} / ${relics.total}`;
      guardian.onRelicCollected(relics.collected);

      if (relics.collected >= relics.total) {
        isGameOver = true;
        dangerVignette.style.opacity = '0';
        if (document.pointerLockElement) document.exitPointerLock?.();
        document.getElementById('victory').style.display = 'flex';
      }
    }

    if (!isGameOver && distToGuardian < Config.GUARDIAN.catchRadius) {
      isGameOver = true;
      dangerVignette.style.opacity = '0.85';
      if (document.pointerLockElement) document.exitPointerLock?.();
      document.getElementById('game-over').style.display = 'flex';
    }
  }

  cameraManager.update();
  renderer.render(scene, camera);
}

animate();