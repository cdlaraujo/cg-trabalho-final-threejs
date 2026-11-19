import { Config } from './Config.js';

const DIRS = [
  [-1, 0], // Norte
  [1, 0],  // Sul
  [0, -1], // Oeste
  [0, 1]   // Leste
];

export class GuardianAI {
  constructor(levelMap, startRow, startCol) {
    this.level = levelMap;
    this.gridPos = { r: startRow, c: startCol };
    this.prevGridPos = { r: startRow, c: startCol };
    this.targetPos = this.level.cellToWorld(startRow, startCol);

    this.state = 'PATROL'; // 'PATROL' | 'HUNT' | 'SEARCH'
    this.lastKnownCell = null;
    this.searchTimer = 0;
    this.isDirectPursuit = false;
    this.tier = Config.GUARDIAN.difficultyTiers[0];
  }

  setDifficulty(relicsCollected) {
    const tiers = Config.GUARDIAN.difficultyTiers;
    this.tier = tiers[Math.min(relicsCollected, tiers.length - 1)];
  }

  hasLineOfSight(fromPos, toPos) {
    const dist = fromPos.distanceTo(toPos);
    if (dist > this.tier.visionRange) return false;

    const steps = Math.ceil(dist / 0.5);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sampleX = fromPos.x + (toPos.x - fromPos.x) * t;
      const sampleZ = fromPos.z + (toPos.z - fromPos.z) * t;
      const cell = this.level.worldToCell(sampleX, sampleZ);
      if (!this.level.isWalkable(cell.r, cell.c)) return false;
    }
    return true;
  }

  // Encontra o próximo passo ótimo pelo labirinto usando Busca em Largura (BFS)
  findNextStepBFS(startCell, goalCell) {
    if (!goalCell || (startCell.r === goalCell.r && startCell.c === goalCell.c)) return null;

    const queue = [{ r: startCell.r, c: startCell.c, firstStep: null }];
    const visited = new Set([`${startCell.r},${startCell.c}`]);

    while (queue.length > 0) {
      const curr = queue.shift();

      for (const [dr, dc] of DIRS) {
        const nr = curr.r + dr;
        const nc = curr.c + dc;
        const key = `${nr},${nc}`;

        if (!visited.has(key) && this.level.isWalkable(nr, nc)) {
          visited.add(key);
          const step = curr.firstStep || { r: nr, c: nc };
          if (nr === goalCell.r && nc === goalCell.c) return step;
          queue.push({ r: nr, c: nc, firstStep: step });
        }
      }
    }
    return null;
  }

  getInterceptCell(player) {
    const baseCell = this.level.worldToCell(player.group.position.x, player.group.position.z);
    if (!this.tier.intercept || !player.isMoving) return baseCell;

    const rotY = player.group.rotation.y;
    const stepR = Math.round(Math.cos(rotY));
    const stepC = Math.round(Math.sin(rotY));

    for (let ahead = 2; ahead >= 1; ahead--) {
      const predR = baseCell.r + stepR * ahead;
      const predC = baseCell.c + stepC * ahead;
      if (this.level.isWalkable(predR, predC)) return { r: predR, c: predC };
    }
    return baseCell;
  }

  choosePatrolStep() {
    const candidates = DIRS
      .map(([dr, dc]) => ({ r: this.gridPos.r + dr, c: this.gridPos.c + dc }))
      .filter((n) => this.level.isWalkable(n.r, n.c));

    if (candidates.length === 0) return null;

    const filtered = candidates.length > 1
      ? candidates.filter((n) => !(n.r === this.prevGridPos.r && n.c === this.prevGridPos.c))
      : candidates;

    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  updatePerception(currentPos, player, deltaTime) {
    const playerPos = player.group.position;
    const dist = currentPos.distanceTo(playerPos);
    const hearingRadius = player.isSprinting ? this.tier.sprintHearing : this.tier.walkHearing;

    if (dist <= hearingRadius || this.hasLineOfSight(currentPos, playerPos)) {
      this.state = 'HUNT';
      this.lastKnownCell = this.level.worldToCell(playerPos.x, playerPos.z);
      this.searchTimer = Config.GUARDIAN.searchDuration;
    } else if (this.state === 'HUNT') {
      this.state = 'SEARCH';
    } else if (this.state === 'SEARCH') {
      this.searchTimer -= deltaTime;
      if (this.searchTimer <= 0) {
        this.state = 'PATROL';
        this.lastKnownCell = null;
      }
    }
  }

  calculateNextMove(currentPos, player, deltaTime) {
    this.updatePerception(currentPos, player, deltaTime);

    const speed = this.state === 'PATROL' ? this.tier.patrolSpeed : this.tier.huntSpeed;
    const currentCell = this.level.worldToCell(currentPos.x, currentPos.z);
    const playerCell = this.level.worldToCell(player.group.position.x, player.group.position.z);

    // Perseguição direta quando ambos estão na mesma célula (avança até capturar)
    if (this.state === 'HUNT' && currentCell.r === playerCell.r && currentCell.c === playerCell.c) {
      this.isDirectPursuit = true;
      this.gridPos = currentCell;
      this.targetPos = player.group.position.clone();
      this.targetPos.y = currentPos.y;

      const vector = new THREE.Vector3().subVectors(this.targetPos, currentPos);
      if (vector.lengthSq() > 0.0001) vector.normalize();
      return { vector, lookAt: this.targetPos, speed };
    }

    let lookAt = null;
    const reachedWaypoint = currentPos.distanceTo(this.targetPos) < 0.08;

    if (reachedWaypoint || this.isDirectPursuit) {
      if (reachedWaypoint) currentPos.copy(this.targetPos);
      this.isDirectPursuit = false;
      this.gridPos = currentCell;

      let nextCell = null;

      if (this.state === 'HUNT') {
        const goalCell = this.getInterceptCell(player);
        nextCell = this.findNextStepBFS(this.gridPos, goalCell) ||
                   this.findNextStepBFS(this.gridPos, playerCell) ||
                   this.findNextStepBFS(this.gridPos, this.lastKnownCell);
      } else if (this.state === 'SEARCH' && this.lastKnownCell) {
        nextCell = this.findNextStepBFS(this.gridPos, this.lastKnownCell);
        if (!nextCell) {
          this.state = 'PATROL';
          this.lastKnownCell = null;
        }
      }

      if (!nextCell) nextCell = this.choosePatrolStep();
      if (!nextCell) return { vector: null, lookAt: null, speed };

      this.prevGridPos = { ...this.gridPos };
      this.gridPos = nextCell;
      this.targetPos = this.level.cellToWorld(nextCell.r, nextCell.c);
      lookAt = this.targetPos;
    }

    const vector = new THREE.Vector3().subVectors(this.targetPos, currentPos).normalize();
    return { vector, lookAt, speed };
  }
}