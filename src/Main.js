// src/main.js
import { LevelMap } from './LevelMap.js';
import { Player } from './Player.js';
import { Guardian } from './Guardian.js';

// ============================================================
// DEBUG = true  → fundo cinza, fog desligado, eixos visíveis
// DEBUG = false → visual "cripta" final
// Se ainda estiver tudo preto com DEBUG=true, é problema de
// carregamento (servidor local / módulo ES / THREE r128).
// ============================================================
const DEBUG = false;

// 1. Universo
const scene = new THREE.Scene();
scene.background = new THREE.Color(DEBUG ? 0x333844 : 0x050508);
scene.fog = DEBUG ? null : new THREE.FogExp2(0x050508, 0.03);

// 2. Câmera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// 3. Renderizador
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

// 4. Iluminação — três camadas
// (a) Ambiente fraco (tinta geral)
const ambientLight = new THREE.AmbientLight(0x2a3550, DEBUG ? 0.9 : 0.55);
scene.add(ambientLight);

// (b) Hemisphere — preenche sombras com tom frio de teto + quente de chão
const hemiLight = new THREE.HemisphereLight(0x4a6fa5, 0x1a202c, DEBUG ? 1.0 : 0.7);
scene.add(hemiLight);

// (c) "Lua" — direcional alta, projetando sombras longas no labirinto
const moonLight = new THREE.DirectionalLight(0xa0b8e0, DEBUG ? 1.1 : 0.85);
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

// 5. Injeção de Dependências
const level = new LevelMap(scene);
level.build();

const player = new Player(scene, level);
const guardian = new Guardian(scene, new THREE.Vector3(0, 0, -4));

// AxesHelper de debug (liga só com DEBUG=true)
if (DEBUG) scene.add(new THREE.AxesHelper(6));

// 6. Game Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.1);

  player.update(deltaTime);
  guardian.update(deltaTime);

  camera.position.set(
    player.group.position.x,
    18,
    player.group.position.z + 14
  );
  camera.lookAt(player.group.position);

  renderer.render(scene, camera);
}

animate();