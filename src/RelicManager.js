import { Config } from './Config.js';

export class RelicManager {
  constructor(scene, levelMap, total = Config.RELICS.total) {
    this.scene = scene;
    this.level = levelMap;
    this.total = total;
    this.collected = 0;
    this.relics = [];
    this.timer = 0;
    this.spawnRelics();
  }

  spawnRelics() {
    const geo = new THREE.OctahedronGeometry(0.45, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: Config.COLORS.relic,
      emissive: Config.COLORS.relic,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8
    });

    const cells = Config.RELICS.spawnCells.slice(0, this.total);

    cells.forEach((cell) => {
      if (!this.level.isWalkable(cell.r, cell.c)) return;

      const worldPos = this.level.cellToWorld(cell.r, cell.c);
      const group = new THREE.Group();
      group.position.set(worldPos.x, 1.35, worldPos.z);

      const crystal = new THREE.Mesh(geo, mat);
      crystal.castShadow = true;
      group.add(crystal);

      // Brilho sutil para destacar o cristal no fundo dos becos escuros
      const glow = new THREE.PointLight(Config.COLORS.relic, 1.1, 7, 2);
      group.add(glow);

      this.scene.add(group);
      this.relics.push({ group, crystal, active: true });
    });
  }

  update(deltaTime, playerPos) {
    this.timer += deltaTime * 3;
    let justCollected = false;

    for (const item of this.relics) {
      if (!item.active) continue;

      item.crystal.rotation.y += deltaTime * 2.2;
      item.group.position.y = 1.35 + Math.sin(this.timer) * 0.18;

      const dx = item.group.position.x - playerPos.x;
      const dz = item.group.position.z - playerPos.z;
      if (Math.hypot(dx, dz) < 1.5) {
        item.active = false;
        this.scene.remove(item.group);
        this.collected++;
        justCollected = true;
      }
    }

    return justCollected;
  }
}