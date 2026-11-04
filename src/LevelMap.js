export class LevelMap {
  constructor(scene) {
    this.scene = scene;
    this.blockSize = 4;
    this.wallsBoxes = [];

    // O jogador nasce na linha 3, coluna 3 (centro exato)
    // Adicionei pilares (1) internamente para criar sombras dinâmicas
    this.grid = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1], // <--- Jogador (3,3)
      [1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ];
  }

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

  build() {
    const rows = this.grid.length;
    const cols = this.grid[0].length;
    const offsetX = -(cols * this.blockSize) / 2 + this.blockSize / 2;
    const offsetZ = -(rows * this.blockSize) / 2 + this.blockSize / 2;

    // CHÃO: Alterado para parecer "pedra úmida" e pegar o brilho da tocha
    const floorGeo = new THREE.PlaneGeometry(cols * this.blockSize, rows * this.blockSize);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x161b22, 
      roughness: 0.6,  // Menos fosco para criar o brilho especular (luz refletida)
      metalness: 0.1   // Leve reflexo
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // PAREDES: Mantidas rochosas e opacas
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