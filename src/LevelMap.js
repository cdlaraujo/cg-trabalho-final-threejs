export class LevelMap {
  constructor(scene) {
    this.scene = scene;
    this.blockSize = 4;
    this.wallsBoxes = []; // AABBs para colisão do jogador

    // 1 = parede, 0 = chão livre
    this.grid = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ];
  }

  // Converte (linha, coluna) em posição de MUNDO (centro da célula, y=0)
  cellToWorld(r, c) {
    const rows = this.grid.length;
    const cols = this.grid[0].length;
    const offsetX = -(cols * this.blockSize) / 2 + this.blockSize / 2;
    const offsetZ = -(rows * this.blockSize) / 2 + this.blockSize / 2;
    return new THREE.Vector3(
      c * this.blockSize + offsetX,
      0,
      r * this.blockSize + offsetZ
    );
  }

  // Inverso — útil para debug ("em que célula estou?")
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

    // Chão
    const floorGeo = new THREE.PlaneGeometry(cols * this.blockSize, rows * this.blockSize);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 1.0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Paredes (geometria + material compartilhados)
    const wallGeo = new THREE.BoxGeometry(this.blockSize, 4, this.blockSize);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9 });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c] === 1) {
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set(
            c * this.blockSize + offsetX,
            2,
            r * this.blockSize + offsetZ
          );
          wall.castShadow = true;
          wall.receiveShadow = true;
          this.scene.add(wall);

          const box = new THREE.Box3().setFromObject(wall);
          this.wallsBoxes.push(box);
        }
      }
    }
  }
}