export class CameraManager {
  constructor(camera, player) {
    this.camera = camera;
    this.player = player;
    this.mode = 1; // 1: 3ª Pessoa, 2: Top-Down, 3: 1ª Pessoa
  }

  toggleMode() {
    this.mode = this.mode === 1 ? 2 : (this.mode === 2 ? 3 : 1);
    return this.mode;
  }

  update() {
    const pos = this.player.group.position;
    
    if (this.mode === 1) {
      this.camera.position.set(pos.x, 18, pos.z + 14);
      this.camera.lookAt(pos);
    } else if (this.mode === 2) {
      this.camera.position.set(pos.x, 35, pos.z + 1);
      this.camera.lookAt(pos);
    } else if (this.mode === 3) {
      const rotY = this.player.group.rotation.y;
      const dirX = Math.sin(rotY);
      const dirZ = Math.cos(rotY);
      this.camera.position.set(pos.x + dirX * 0.3, pos.y + 2.4, pos.z + dirZ * 0.3);
      this.camera.lookAt(this.camera.position.x + dirX, this.camera.position.y, this.camera.position.z + dirZ);
    }
  }
}