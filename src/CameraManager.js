import { Config } from './Config.js';

export class CameraManager {
  constructor(camera, player, level) {
    this.camera = camera;
    this.player = player;
    this.level = level;
    this.mode = 1; // 1: Terceira Pessoa, 2: Primeira Pessoa
    this.raycaster = new THREE.Raycaster();
    this.occludedWalls = [];
  }

  toggleMode() {
    this.mode = this.mode === 1 ? 2 : 1;
    
    // Troca o FOV (Campo de Visão) para evitar enjoo na 1ª pessoa
    const targetFov = this.mode === 2 ? Config.CAMERA.firstPersonFov : Config.CAMERA.fov;
    if (this.camera.fov !== targetFov) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }

    this.resetWallOpacity();
    return this.mode;
  }

  resetWallOpacity() {
    for (const wall of this.occludedWalls) {
      wall.material.transparent = false;
      wall.material.opacity = 1.0;
    }
    this.occludedWalls = [];
  }

  handleWallOcclusion(targetPos) {
    this.resetWallOpacity();
    if (!this.level || !this.level.wallMeshes) return;

    const dir = new THREE.Vector3().subVectors(targetPos, this.camera.position);
    const dist = dir.length();
    dir.normalize();

    this.raycaster.set(this.camera.position, dir);
    this.raycaster.far = dist;

    const hits = this.raycaster.intersectObjects(this.level.wallMeshes, false);
    for (const hit of hits) {
      const wall = hit.object;
      wall.material.transparent = true;
      wall.material.opacity = 0.25;
      this.occludedWalls.push(wall);
    }
  }

  update() {
    const pos = this.player.group.position;

    if (this.mode === 1) {
      // Terceira Pessoa
      this.camera.position.set(pos.x, 14.5, pos.z + 11.5);
      const lookTarget = new THREE.Vector3(pos.x, pos.y + 1.2, pos.z);
      this.camera.lookAt(lookTarget);
      this.handleWallOcclusion(lookTarget);
      
    } else if (this.mode === 2) {
      // Primeira Pessoa imersiva
      const rotY = this.player.group.rotation.y;
      const dirX = Math.sin(rotY);
      const dirZ = Math.cos(rotY);
      
      // Câmera posicionada exatamente no lugar dos olhos da malha
      this.camera.position.set(pos.x + dirX * 0.1, pos.y + 2.35, pos.z + dirZ * 0.1);
      this.camera.lookAt(
        this.camera.position.x + dirX,
        this.camera.position.y - 0.05,
        this.camera.position.z + dirZ
      );
    }
  }
}