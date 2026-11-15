export class RelicManager {
  constructor(scene, levelMap, total = 4) {
    this.scene = scene;
    this.level = levelMap;
    this.total = total;
    this.collected = 0;
    this.relics = [];
    this.timer = 0;

    this.spawnRandomRelics();
  }

  spawnRandomRelics() {
    const validCells = [];
    const rows = this.level.grid.length;
    const cols = this.level.grid[0].length;

    // 1. Mapeia todo chão livre (0), ignorando os spawns do Player (3,3) e Golem (1,3)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isPlayerSpawn = (r === 3 && c === 3);
        const isGuardianSpawn = (r === 1 && c === 3);

        if (this.level.grid[r][c] === 0 && !isPlayerSpawn && !isGuardianSpawn) {
          validCells.push({ r, c });
        }
      }
    }

    // 2. Embaralha e pega as 4 primeiras células sorteadas
    validCells.sort(() => Math.random() - 0.5);
    const chosenCells = validCells.slice(0, this.total);

    // 3. Cria os cristais 3D (com brilho próprio para serem visíveis no escuro)
    const geo = new THREE.OctahedronGeometry(0.4);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xd69e2e,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });

    chosenCells.forEach(cell => {
      const mesh = new THREE.Mesh(geo, mat);
      const pos = this.level.cellToWorld(cell.r, cell.c);
      mesh.position.set(pos.x, 1.0, pos.z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.relics.push(mesh);
    });
  }

  update(deltaTime, playerPos) {
    this.timer += deltaTime * 3;
    let collectedNow = false;

    for (let i = this.relics.length - 1; i >= 0; i--) {
      const relic = this.relics[i];

      // Animação simples de rotação e flutuação
      relic.rotation.y += deltaTime * 2;
      relic.position.y = 1.0 + Math.sin(this.timer + i) * 0.15;

      // Checa proximidade com o jogador
      if (relic.position.distanceTo(playerPos) < 1.5) {
        this.scene.remove(relic);
        this.relics.splice(i, 1);
        this.collected++;
        collectedNow = true;
      }
    }

    return collectedNow;
  }
}