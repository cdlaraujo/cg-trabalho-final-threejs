import { Config } from './Config.js';
import { Input } from './Input.js';
import { LightManager } from './LightManager.js';
import { CameraManager } from './CameraManager.js';
import { LevelMap } from './LevelMap.js';
import { Player } from './Player.js';
import { Guardian } from './Guardian.js';
import { RelicManager } from './RelicManager.js';

// 1. Setup Base
Input.init();
const scene = new THREE.Scene();
scene.background = new THREE.Color(Config.COLORS.background);
scene.fog = new THREE.FogExp2(Config.COLORS.fog, 0.03);

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

// 2. Instanciação dos Sistemas e Entidades
const lightManager = new LightManager(scene);
const level = new LevelMap(scene);
level.build();

const player = new Player(scene, level);
const guardian = new Guardian(scene, level, player, 1, 3);
const relics = new RelicManager(scene, level, 4);
const cameraManager = new CameraManager(camera, player);

// 3. Estado do Jogo e Interface (HUD)
let isGameOver = false;

function updateUI() {
  const modes = { 1: "Terceira Pessoa", 2: "Top-Down (Tática)", 3: "Primeira Pessoa" };
  document.getElementById('ui-cam').innerText = modes[cameraManager.mode];

  const updateLuz = (id, lightObj) => {
    const el = document.getElementById(id);
    el.innerText = lightObj.visible ? "ON" : "OFF";
    el.className = lightObj.visible ? "status-on" : "status-off";
  };

  updateLuz('ui-l1', lightManager.ambientLight);
  updateLuz('ui-l2', lightManager.hemiLight);
  updateLuz('ui-l3', lightManager.moonLight);
  updateLuz('ui-l4', player.torchLight);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  // Se ganhou ou perdeu, trava os controles e escuta apenas o reinício
  if (isGameOver) {
    if (key === 'r') location.reload();
    return;
  }

  if (key === 'c') cameraManager.toggleMode();
  if (key === '1') lightManager.toggle('ambient');
  if (key === '2') lightManager.toggle('hemi');
  if (key === '3') lightManager.toggle('moon');
  if (key === '4') player.torchLight.visible = !player.torchLight.visible;
  updateUI();
});

// 4. Game Loop Principal
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = Math.min(clock.getDelta(), 0.1);

  if (!isGameOver) {
    player.update(deltaTime);
    guardian.update(deltaTime);

    // Atualiza relíquias, pontuação e verifica condição de Vitória
    if (relics.update(deltaTime, player.group.position)) {
      document.getElementById('ui-score').innerText = `${relics.collected} / ${relics.total}`;

      if (relics.collected >= relics.total) {
        isGameOver = true;
        document.getElementById('victory').style.display = 'flex';
      }
    }

    // Verifica colisão com o Guardião (condição de Derrota)
    if (!isGameOver && guardian.group.position.distanceTo(player.group.position) < 1.8) {
      isGameOver = true;
      document.getElementById('game-over').style.display = 'flex';
    }
  }

  cameraManager.update();
  renderer.render(scene, camera);
}

animate();