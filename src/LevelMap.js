import { Config } from './Config.js';
import { loadTexture, updateTorchFlicker } from './Entity.js';

const TORCH_DIRS = {
  N: { dx: 0, dz: -1, rotX: -Math.PI / 5, rotZ: 0 },
  S: { dx: 0, dz:  1, rotX:  Math.PI / 5, rotZ: 0 },
  E: { dx: 1, dz:  0, rotX: 0, rotZ: -Math.PI / 5 },
  W: { dx: -1, dz: 0, rotX: 0, rotZ:  Math.PI / 5 }
};

export class LevelMap {
  constructor(scene) {
    this.scene = scene;
    this.blockSize = Config.LEVEL.blockSize;
    this.grid = Config.LEVEL.grid;

    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
    this.offsetX = -(this.cols * this.blockSize) / 2 + this.blockSize / 2;
    this.offsetZ = -(this.rows * this.blockSize) / 2 + this.blockSize / 2;

    this.wallsBoxes = [];
    this.wallMeshes = [];
    this.wallTorches = [];
    this.flickerTimer = 0;

    this.relics = [];
    this.collectedRelics = 0;
    this.totalRelics = Config.RELICS.total;
    this.relicTimer = 0;
  }

  cellToWorld(r, c) {
    return new THREE.Vector3(
      c * this.blockSize + this.offsetX,
      0,
      r * this.blockSize + this.offsetZ
    );
  }

  worldToCell(x, z) {
    return {
      r: Math.round((z - this.offsetZ) / this.blockSize),
      c: Math.round((x - this.offsetX) / this.blockSize)
    };
  }

  isWalkable(r, c) {
    return this.grid[r]?.[c] === 0;
  }

  build() {
    // 1. Piso
    const floorMat = new THREE.MeshStandardMaterial({
      map: loadTexture(Config.TEXTURES.floor, this.cols, this.rows),
      roughness: 0.75,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(this.cols * this.blockSize, this.rows * this.blockSize),
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Paredes (apenas dois materiais compartilhados: normal e translúcido)
    const wallGeo = new THREE.BoxGeometry(this.blockSize, 4, this.blockSize);
    this.wallMat = new THREE.MeshStandardMaterial({
      map: loadTexture(Config.TEXTURES.wall, 2, 2),
      roughness: 0.88,
      metalness: 0.12
    });
    this.occludedWallMat = this.wallMat.clone();
    this.occludedWallMat.transparent = true;
    this.occludedWallMat.opacity = 0.25;

    this.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== 1) return;
        const wall = new THREE.Mesh(wallGeo, this.wallMat);
        wall.position.copy(this.cellToWorld(r, c)).setY(2);
        wall.castShadow = wall.receiveShadow = true;

        this.scene.add(wall);
        this.wallMeshes.push(wall);
        this.wallsBoxes.push(new THREE.Box3().setFromObject(wall));
      });
    });

    // 3. Tochas e Relíquias
    this.buildWallTorches();
    this.buildRelics();
  }

  buildWallTorches() {
    const handleMat = new THREE.MeshStandardMaterial({ map: loadTexture(Config.TEXTURES.wood), roughness: 0.9 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.7, roughness: 0.4 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa94d });

    const halfBlock = this.blockSize / 2;
    const { color, intensity, distance, decay } = Config.LIGHTS.wallTorch;

    Config.LEVEL.wallTorches.forEach(({ r, c, dir }, index) => {
      const offset = TORCH_DIRS[dir];
      if (this.grid[r]?.[c] !== 1 || !offset) return;

      const wallCenter = this.cellToWorld(r, c);
      const torchGroup = new THREE.Group();
      torchGroup.position.set(
        wallCenter.x + offset.dx * (halfBlock + 0.15),
        2.35,
        wallCenter.z + offset.dz * (halfBlock + 0.15)
      );

      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), ironMat);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.65), handleMat);
      stick.position.set(offset.dx * 0.12, 0.18, offset.dz * 0.12);
      stick.rotation.set(offset.rotX, 0, offset.rotZ);

      const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), flameMat);
      flame.position.y = 0.38;
      stick.add(flame);

      const light = new THREE.PointLight(color, intensity, distance, decay);
      light.position.set(offset.dx * 0.45, 0.55, offset.dz * 0.45);

      torchGroup.add(bracket, stick, light);
      this.scene.add(torchGroup);
      this.wallTorches.push({ light, flame, baseIntensity: intensity, phase: index * 1.7 });
    });
  }

  buildRelics() {
    const geo = new THREE.OctahedronGeometry(0.45, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: Config.COLORS.relic,
      emissive: Config.COLORS.relic,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8
    });

    Config.RELICS.spawnCells.slice(0, this.totalRelics).forEach(({ r, c }) => {
      if (!this.isWalkable(r, c)) return;

      const worldPos = this.cellToWorld(r, c);
      const group = new THREE.Group();
      group.position.set(worldPos.x, 1.35, worldPos.z);

      const crystal = new THREE.Mesh(geo, mat);
      crystal.castShadow = true;
      const glow = new THREE.PointLight(Config.COLORS.relic, 1.1, 7, 2);

      group.add(crystal, glow);
      this.scene.add(group);
      this.relics.push({ group, crystal, active: true });
    });
  }

  update(deltaTime, playerPos = null) {
    // Oscilação das tochas
    this.flickerTimer += deltaTime * 7.5;
    for (const torch of this.wallTorches) {
      updateTorchFlicker(torch.light, torch.flame, torch.baseIntensity, this.flickerTimer, torch.phase, 0.18);
    }

    // Flutuação e coleta das relíquias
    if (!playerPos) return false;
    this.relicTimer += deltaTime * 3;
    let justCollected = false;

    for (const item of this.relics) {
      if (!item.active) continue;

      item.crystal.rotation.y += deltaTime * 2.2;
      item.group.position.y = 1.35 + Math.sin(this.relicTimer) * 0.18;

      if (Math.hypot(item.group.position.x - playerPos.x, item.group.position.z - playerPos.z) < 1.5) {
        item.active = false;
        this.scene.remove(item.group);
        this.collectedRelics++;
        justCollected = true;
      }
    }

    return justCollected;
  }
}