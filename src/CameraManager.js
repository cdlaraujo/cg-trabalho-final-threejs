import { Config } from './Config.js';

export class CameraManager {
  constructor(camera, player, level) {
    this.camera = camera;
    this.player = player;
    this.level = level;
    this.mode = 1; // 1: 3ª Pessoa, 2: Top-Down, 3: 1ª Pessoa

    this.raycaster = new THREE.Raycaster();
    this.targetLook = new THREE.Vector3();
    this.desiredPos = new THREE.Vector3();
  }

  toggleMode() {
    this.mode = this.mode === 1 ? 2 : (this.mode === 2 ? 3 : 1);

    const targetFov = this.mode === 3 ? Config.CAMERA.firstPersonFov : Config.CAMERA.fov;
    if (this.camera.fov !== targetFov) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }

    this.player.setFirstPersonView(this.mode === 3);

    if (this.mode !== 1) {
      this.resetWallOpacity();
    }

    return this.mode;
  }

  resetWallOpacity() {
    for (const wall of this.level.wallMeshes) {
      wall.material.opacity = 1.0;
      wall.material.transparent = false;
      wall.material.depthWrite = true;
    }
  }

  updateWallOcclusion(targetPoint) {
    const dir = this.targetLook.copy(targetPoint).sub(this.camera.position);
    const dist = dir.length();
    dir.normalize();

    this.raycaster.set(this.camera.position, dir);
    this.raycaster.far = dist;

    const hits = this.raycaster.intersectObjects(this.level.wallMeshes);
    const occludedWalls = new Set(hits.map(hit => hit.object));

    for (const wall of this.level.wallMeshes) {
      const targetOpacity = occludedWalls.has(wall) ? 0.22 : 1.0;
      const mat = wall.material;
      mat.opacity += (targetOpacity - mat.opacity) * 0.2;
      mat.transparent = mat.opacity < 0.98;
      mat.depthWrite = mat.opacity > 0.5;
    }
  }

  update(deltaTime = 0.016) {
    const pos = this.player.group.position;

    if (this.mode === 1) {
      const { height, distance, smoothing } = Config.CAMERA.thirdPerson;
      this.desiredPos.set(pos.x, height, pos.z + distance);

      const alpha = 1 - Math.exp(-smoothing * deltaTime);
      this.camera.position.lerp(this.desiredPos, alpha);

      const focusPoint = new THREE.Vector3(pos.x, 1.4, pos.z);
      this.camera.lookAt(focusPoint);
      this.updateWallOcclusion(focusPoint);

    } else if (this.mode === 2) {
      this.camera.position.set(pos.x, Config.CAMERA.topDown.height, pos.z + 0.5);
      this.camera.lookAt(pos.x, 0, pos.z);

    } else if (this.mode === 3) {
      const rotY = this.player.group.rotation.y;
      const dirX = Math.sin(rotY);
      const dirZ = Math.cos(rotY);

      this.camera.position.set(
        pos.x + dirX * 0.25,
        pos.y + 2.15,
        pos.z + dirZ * 0.25
      );

      this.camera.lookAt(
        this.camera.position.x + dirX,
        this.camera.position.y - 0.12,
        this.camera.position.z + dirZ
      );
    }
  }
}