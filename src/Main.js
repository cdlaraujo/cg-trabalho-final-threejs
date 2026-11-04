import { Input } from './Input.js';
import { LightManager } from './LightManager.js';
import { CameraManager } from './CameraManager.js';
import { LevelMap } from './LevelMap.js';
import { Player } from './Player.js';
import { Guardian } from './Guardian.js';

// Setup Base
Input.init();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);
scene.fog = new THREE.FogExp2(0x050508, 0.03);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Instanciação dos Sistemas e Entidades
const lightManager = new LightManager(scene);
const level = new LevelMap(scene);
level.build();

const player = new Player(scene, level);
const guardian = new Guardian(scene, new THREE.Vector3(0, 0, -4));
const cameraManager = new CameraManager(camera, player);

// Eventos de Interface e Toggles da Entrega 03
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
  if (key === 'c') cameraManager.toggleMode();
  if (key === '1') lightManager.toggle('ambient');
  if (key === '2') lightManager.toggle('hemi');
  if (key === '3') lightManager.toggle('moon');
  if (key === '4') player.torchLight.visible = !player.torchLight.visible;
  updateUI();
});

// Game Loop Principal
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = Math.min(clock.getDelta(), 0.1);

  player.update(deltaTime);
  guardian.update(deltaTime);
  cameraManager.update();

  renderer.render(scene, camera);
}

animate();