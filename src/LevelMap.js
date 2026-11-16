import { Config } from './Config.js';

export class LevelMap {
  constructor(scene) {
    this.scene = scene;
    this.blockSize = Config.LEVEL.blockSize;
    this.grid = Config.LEVEL.grid;
    this.wallsBoxes = [];
    this.wallMeshes = [];
    this.wallTorches = [];
    this.flickerTimer = 0;
    this.textureLoader = new THREE.TextureLoader();
  }

  cellToWorld(r, c) {
    const rows = this.grid.length;
    const cols = this.grid[0].length;
    const offsetX = -(cols * this.blockSize) / 2 + this.blockSize / 2;
    const offsetZ = -(rows * this.blockSize) / 2 + this.blockSize / 2;
    return new THREE.Vector3(c * this.blockSize + offsetX, 0, r * this.blockSize + offsetZ);
  }

  worldToCell(x, z) {
    const rows = this.grid.length;
    const cols = this.grid[0].length;
    const offsetX = -(cols * this.blockSize) / 2 + this.blockSize / 2;
    const offsetZ = -(rows * this.blockSize) / 2 + this.blockSize / 2;
    return {
      r: Math.round((z - offsetZ) / this.blockSize),
      c: Math.round((x - offsetX) / this.blockSize)
    };
  }

  isWalkable(r, c) {
    if (r < 0 || c < 0 || r >= this.grid.length || c >= this.grid[0].length) return false;
    return this.grid[r][c] === 0;
  }

  build() {
    const rows = this.grid.length;
    const cols = this.grid[0].length;
    const offsetX = -(cols * this.blockSize) / 2 + this.blockSize / 2;
    const offsetZ = -(rows * this.blockSize) / 2 + this.blockSize / 2;

    // 1. Piso de lajotas
    const floorTexture = this.textureLoader.load(Config.TEXTURES.floor);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(cols, rows);

    const floorGeo = new THREE.PlaneGeometry(cols * this.blockSize, rows * this.blockSize);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.75,
      metalness: 0.1
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Paredes de tijolos
    const wallTexture = this.textureLoader.load(Config.TEXTURES.wall);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);

    const wallGeo = new THREE.BoxGeometry(this.blockSize, 4, this.blockSize);
    const baseWallMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.88,
      metalness: 0.12
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c] === 1) {
          const wall = new THREE.Mesh(wallGeo, baseWallMat.clone());
          wall.position.set(c * this.blockSize + offsetX, 2, r * this.blockSize + offsetZ);
          wall.castShadow = true;
          wall.receiveShadow = true;
          this.scene.add(wall);

          this.wallMeshes.push(wall);
          this.wallsBoxes.push(new THREE.Box3().setFromObject(wall));
        }
      }
    }

    // 3. Tochas esparsas nas paredes dos cruzamentos principais
    this.buildWallTorches();
  }

  buildWallTorches() {
    const woodTexture = this.textureLoader.load(Config.TEXTURES.wood);
    const handleMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.9 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.7, roughness: 0.4 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa94d });

    const halfBlock = this.blockSize / 2;
    const { color, intensity, distance, decay } = Config.LIGHTS.wallTorch;

    const dirOffsets = {
      N: { dx: 0, dz: -1, rotX: -Math.PI / 5, rotZ: 0 },
      S: { dx: 0, dz:  1, rotX:  Math.PI / 5, rotZ: 0 },
      E: { dx: 1, dz:  0, rotX: 0, rotZ: -Math.PI / 5 },
      W: { dx: -1, dz: 0, rotX: 0, rotZ:  Math.PI / 5 }
    };

    Config.LEVEL.wallTorches.forEach((t, index) => {
      if (this.grid[t.r]?.[t.c] !== 1) return;
      const offset = dirOffsets[t.dir];
      if (!offset) return;

      const wallCenter = this.cellToWorld(t.r, t.c);
      const torchGroup = new THREE.Group();
      torchGroup.position.set(
        wallCenter.x + offset.dx * (halfBlock + 0.15),
        2.35,
        wallCenter.z + offset.dz * (halfBlock + 0.15)
      );

      // Suporte de ferro na parede
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), ironMat);
      torchGroup.add(bracket);

      // Cabo inclinado da tocha
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.65), handleMat);
      stick.position.set(offset.dx * 0.12, 0.18, offset.dz * 0.12);
      stick.rotation.set(offset.rotX, 0, offset.rotZ);
      torchGroup.add(stick);

      // Chama emissiva
      const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), flameMat);
      flame.position.y = 0.38;
      stick.add(flame);

      // Luz pontual quente (sem shadow map individual para manter alta taxa de quadros)
      const light = new THREE.PointLight(color, intensity, distance, decay);
      light.position.set(offset.dx * 0.45, 0.55, offset.dz * 0.45);
      torchGroup.add(light);

      this.scene.add(torchGroup);
      this.wallTorches.push({ light, flame, baseIntensity: intensity, phase: index * 1.7 });
    });
  }

  update(deltaTime) {
    this.flickerTimer += deltaTime * 7.5;
    for (const torch of this.wallTorches) {
      const wave =
        Math.sin(this.flickerTimer + torch.phase) * 0.18 +
        Math.cos(this.flickerTimer * 2.3 + torch.phase) * 0.1;
      torch.light.intensity = torch.baseIntensity + wave;
      const scale = 1 + wave * 0.35;
      torch.flame.scale.set(scale, scale * 1.25, scale);
    }
  }
}