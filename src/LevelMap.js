import { Config } from './Config.js';

export class LevelMap {
  constructor(scene) {
    this.scene = scene;
    this.blockSize = Config.LEVEL.blockSize;
    this.grid = Config.LEVEL.grid;
    this.wallsBoxes = [];
    this.textureLoader = new THREE.TextureLoader();
  }

  cellToWorld(r, c) {
    const rows = this.grid.length;
    const cols = this.grid[0].length;
    const offsetX = -(cols * this.blockSize) / 2 + this.blockSize / 2;
    const offsetZ = -(rows * this.blockSize) / 2 + this.blockSize / 2;
    return new THREE.Vector3(c * this.blockSize + offsetX, 0, r * this.blockSize + offsetZ);
  }

  build() {
    const rows = this.grid.length;
    const cols = this.grid[0].length;
    const offsetX = -(cols * this.blockSize) / 2 + this.blockSize / 2;
    const offsetZ = -(rows * this.blockSize) / 2 + this.blockSize / 2;

    const floorTexture = this.textureLoader.load(Config.TEXTURES.floor);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(cols, rows); // Dinâmico, baseado no grid

    const floorGeo = new THREE.PlaneGeometry(cols * this.blockSize, rows * this.blockSize);
    const floorMat = new THREE.MeshStandardMaterial({ 
      map: floorTexture, roughness: 0.7, metalness: 0.1 
    });
    
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const wallTexture = this.textureLoader.load(Config.TEXTURES.wall);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);

    const wallGeo = new THREE.BoxGeometry(this.blockSize, 4, this.blockSize);
    const wallMat = new THREE.MeshStandardMaterial({ 
      map: wallTexture, roughness: 0.85, metalness: 0.15 
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c] === 1) {
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set(c * this.blockSize + offsetX, 2, r * this.blockSize + offsetZ);
          wall.castShadow = true;
          wall.receiveShadow = true;
          this.scene.add(wall);
          this.wallsBoxes.push(new THREE.Box3().setFromObject(wall));
        }
      }
    }
  }
}