import { LevelMap } from './LevelMap.js';
import { Player } from './Player.js';
import { Guardian } from './Guardian.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);
scene.fog = new THREE.FogExp2(0x050508, 0.03);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Luzes
const ambientLight = new THREE.AmbientLight(0x2a3550, 0.55);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x4a6fa5, 0x1a202c, 0.7);
scene.add(hemiLight);

const moonLight = new THREE.DirectionalLight(0xa0b8e0, 0.85);
moonLight.position.set(8, 16, 6);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.left = -20;
moonLight.shadow.camera.right = 20;
moonLight.shadow.camera.top = 20;
moonLight.shadow.camera.bottom = -20;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 50;
moonLight.shadow.bias = -0.0005;
scene.add(moonLight);
scene.add(moonLight.target);

// Entidades
const level = new LevelMap(scene);
level.build();

const player = new Player(scene, level);
const guardian = new Guardian(scene, new THREE.Vector3(0, 0, -4));

// --- SISTEMA DE DEMONSTRAÇÃO E UI ---
let cameraMode = 1; // 1: 3ª Pessoa, 2: Top-Down, 3: 1ª Pessoa

function updateUI() {
  let camText = "Terceira Pessoa";
  if (cameraMode === 2) camText = "Top-Down (Tática)";
  if (cameraMode === 3) camText = "Primeira Pessoa";
  
  document.getElementById('ui-cam').innerText = camText;
  
  const updateLuz = (id, lightObj) => {
    const el = document.getElementById(id);
    if(lightObj.visible) {
      el.innerText = "ON";
      el.className = "status-on";
    } else {
      el.innerText = "OFF";
      el.className = "status-off";
    }
  };

  updateLuz('ui-l1', ambientLight);
  updateLuz('ui-l2', hemiLight);
  updateLuz('ui-l3', moonLight);
  updateLuz('ui-l4', player.torchLight);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  
  if (key === 'c') {
    cameraMode = cameraMode === 1 ? 2 : (cameraMode === 2 ? 3 : 1);
    updateUI();
  }
  
  if (key === '1') {
    ambientLight.visible = !ambientLight.visible;
    updateUI();
  }
  if (key === '2') {
    hemiLight.visible = !hemiLight.visible;
    updateUI();
  }
  if (key === '3') {
    moonLight.visible = !moonLight.visible;
    updateUI();
  }
  if (key === '4') {
    player.torchLight.visible = !player.torchLight.visible;
    updateUI();
  }
});

// Game Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.1);

  player.update(deltaTime);
  guardian.update(deltaTime);

  if (cameraMode === 1) {
    camera.position.set(player.group.position.x, 18, player.group.position.z + 14);
    camera.lookAt(player.group.position);
  } else if (cameraMode === 2) {
    camera.position.set(player.group.position.x, 35, player.group.position.z + 1); 
    camera.lookAt(player.group.position);
  } else if (cameraMode === 3) {
    const headHeight = 2.4; 
    const forwardOffset = 0.3;
    const rotY = player.group.rotation.y;
    const dirX = Math.sin(rotY);
    const dirZ = Math.cos(rotY);
    camera.position.set(
      player.group.position.x + dirX * forwardOffset,
      player.group.position.y + headHeight,
      player.group.position.z + dirZ * forwardOffset
    );
    const lookTarget = new THREE.Vector3(
      camera.position.x + dirX,
      camera.position.y,
      camera.position.z + dirZ
    );
    camera.lookAt(lookTarget);
  }

  renderer.render(scene, camera);
}

animate();