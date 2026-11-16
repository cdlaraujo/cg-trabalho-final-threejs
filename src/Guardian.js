import { Config } from './Config.js';

const addMesh = (geo, mat, parent, [x, y, z]) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
};

// ==========================================
// IA PREDADORA (Patrulha, Caça com BFS e Busca)
// ==========================================
class GuardianAI {
  constructor(levelMap, startRow, startCol) {
    this.level = levelMap;
    this.gridPos = { r: startRow, c: startCol };
    this.prevGridPos = { r: startRow, c: startCol };
    this.targetPos = this.level.cellToWorld(startRow, startCol);

    this.state = 'PATROL'; // 'PATROL' | 'HUNT' | 'SEARCH'
    this.lastKnownCell = null;
    this.searchTimer = 0;
    this.tier = Config.GUARDIAN.difficultyTiers[0];
  }

  setDifficulty(relicsCollected) {
    const tiers = Config.GUARDIAN.difficultyTiers;
    const idx = Math.min(relicsCollected, tiers.length - 1);
    this.tier = tiers[idx];
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
      if (!this.level.isWalkable(cell.r, cell.c)) {
        return false;
      }
    }
    return true;
  }

  // Encontra o próximo passo ótimo pelo labirinto usando Busca em Largura (BFS)
  findNextStepBFS(startCell, goalCell) {
    if (startCell.r === goalCell.r && startCell.c === goalCell.c) return null;

    const queue = [{ r: startCell.r, c: startCell.c, firstStep: null }];
    const visited = new Set([`${startCell.r},${startCell.c}`]);
    const dirs = [
      { dr: -1, dc: 0 },
      { dr:  1, dc: 0 },
      { dr:  0, dc: -1 },
      { dr:  0, dc: 1 }
    ];

    while (queue.length > 0) {
      const curr = queue.shift();

      for (const d of dirs) {
        const nr = curr.r + d.dr;
        const nc = curr.c + d.dc;
        const key = `${nr},${nc}`;

        if (!visited.has(key) && this.level.isWalkable(nr, nc)) {
          visited.add(key);
          const step = curr.firstStep || { r: nr, c: nc };
          if (nr === goalCell.r && nc === goalCell.c) {
            return step;
          }
          queue.push({ r: nr, c: nc, firstStep: step });
        }
      }
    }
    return null;
  }

  getInterceptCell(player) {
    const baseCell = this.level.worldToCell(player.group.position.x, player.group.position.z);
    if (!this.tier.intercept) return baseCell;

    // Tenta prever 2 blocos à frente da direção em que o jogador está olhando para cercá-lo
    const rotY = player.group.rotation.y;
    const stepR = Math.round(Math.cos(rotY));
    const stepC = Math.round(Math.sin(rotY));

    for (let ahead = 2; ahead >= 1; ahead--) {
      const predR = baseCell.r + stepR * ahead;
      const predC = baseCell.c + stepC * ahead;
      if (this.level.isWalkable(predR, predC)) {
        return { r: predR, c: predC };
      }
    }
    return baseCell;
  }

  choosePatrolStep() {
    const candidates = [
      { r: this.gridPos.r - 1, c: this.gridPos.c },
      { r: this.gridPos.r + 1, c: this.gridPos.c },
      { r: this.gridPos.r, c: this.gridPos.c - 1 },
      { r: this.gridPos.r, c: this.gridPos.c + 1 }
    ].filter((n) => this.level.isWalkable(n.r, n.c));

    if (candidates.length === 0) return null;

    // Evita voltar pelo mesmo corredor se houver outras opções
    let filtered = candidates;
    if (candidates.length > 1) {
      filtered = candidates.filter(
        (n) => !(n.r === this.prevGridPos.r && n.c === this.prevGridPos.c)
      );
    }
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  updatePerception(currentPos, player, deltaTime) {
    const playerPos = player.group.position;
    const dist = currentPos.distanceTo(playerPos);
    const hearingRadius = player.isSprinting ? this.tier.sprintHearing : this.tier.walkHearing;

    const detected = dist <= hearingRadius || this.hasLineOfSight(currentPos, playerPos);

    if (detected) {
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
    const distToTarget = currentPos.distanceTo(this.targetPos);

    if (distToTarget < 0.08) {
      currentPos.copy(this.targetPos);
      let nextCell = null;

      if (this.state === 'HUNT') {
        const goalCell = this.getInterceptCell(player);
        nextCell = this.findNextStepBFS(this.gridPos, goalCell) ||
                   this.findNextStepBFS(this.gridPos, this.lastKnownCell);
      } else if (this.state === 'SEARCH' && this.lastKnownCell) {
        nextCell = this.findNextStepBFS(this.gridPos, this.lastKnownCell);
        if (!nextCell) {
          this.state = 'PATROL';
          this.lastKnownCell = null;
        }
      }

      if (!nextCell) {
        nextCell = this.choosePatrolStep();
      }

      if (nextCell) {
        this.prevGridPos = { ...this.gridPos };
        this.gridPos = nextCell;
        this.targetPos = this.level.cellToWorld(nextCell.r, nextCell.c);
        return { action: 'turn', lookAt: this.targetPos, speed };
      }
    } else {
      const dir = new THREE.Vector3().subVectors(this.targetPos, currentPos).normalize();
      return { action: 'move', vector: dir, speed };
    }

    return { action: 'idle', speed };
  }
}

// ==========================================
// RENDERIZAÇÃO E ANIMAÇÃO DO GUARDIÃO
// ==========================================
export class Guardian {
  constructor(scene, levelMap, player) {
    this.scene = scene;
    this.player = player;
    this.group = new THREE.Group();

    const { r, c } = Config.GUARDIAN.startCell;
    this.ai = new GuardianAI(levelMap, r, c);

    this.group.position.copy(this.ai.targetPos);
    this.scene.add(this.group);
    this.animationTimer = 0;
    this.buildModel();
  }

  buildModel() {
    const tex = new THREE.TextureLoader().load(Config.TEXTURES.golem);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.2 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: Config.COLORS.golemEye });

    this.torso = addMesh(new THREE.BoxGeometry(1.6, 1.8, 1.0), mat, this.group, [0, 2.0, 0]);
    addMesh(new THREE.BoxGeometry(0.22, 0.11, 0.1), eyeMat, this.torso, [-0.35, 0.4, 0.52]);
    addMesh(new THREE.BoxGeometry(0.22, 0.11, 0.1), eyeMat, this.torso, [0.35, 0.4, 0.52]);
    this.core = addMesh(new THREE.OctahedronGeometry(0.28), eyeMat, this.torso, [0, 0.05, 0.55]);

    // Aura vermelha no peito do Guardião para denunciar sua presença nas paredes próximas
    this.coreLight = new THREE.PointLight(Config.COLORS.golemEye, 1.2, 9, 2);
    this.coreLight.position.set(0, 0.05, 0.9);
    this.torso.add(this.coreLight);

    const armGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5).translate(0, -0.7, 0);
    const legGeo = new THREE.BoxGeometry(0.6, 1.0, 0.7).translate(0, -0.5, 0);

    this.leftArm = addMesh(armGeo, mat, this.torso, [-1.1, 0.6, 0]);
    this.rightArm = addMesh(armGeo, mat, this.torso, [1.1, 0.6, 0]);
    this.leftLeg = addMesh(legGeo, mat, this.torso, [-0.5, -0.9, 0]);
    this.rightLeg = addMesh(legGeo, mat, this.torso, [0.5, -0.9, 0]);
  }

  onRelicCollected(collectedCount) {
    this.ai.setDifficulty(collectedCount);
  }

  getState() {
    return this.ai.state;
  }

  update(deltaTime) {
    const decision = this.ai.calculateNextMove(this.group.position, this.player, deltaTime);

    // Acelera a animação proporcionalmente à velocidade atual do Golem
    const pace = decision.speed * 0.95;
    this.animationTimer += deltaTime * pace;
    const t = this.animationTimer;

    this.torso.position.y = 2.0 + Math.sin(t * 1.2) * 0.15;
    this.leftArm.rotation.x = Math.sin(t) * 0.45;
    this.rightArm.rotation.x = -Math.sin(t) * 0.45;
    this.core.rotation.y += deltaTime * (this.ai.state === 'HUNT' ? 5.0 : 1.8);

    // Pulsa a luz vermelha do núcleo com base no estado e nas relíquias coletadas
    const baseCore = this.ai.tier.coreIntensity;
    const huntBoost = this.ai.state === 'HUNT' ? 1.0 : 0.0;
    this.coreLight.intensity = baseCore + huntBoost + Math.sin(t * 2.5) * 0.35;

    if (decision.action === 'move') {
      this.group.position.add(decision.vector.multiplyScalar(decision.speed * deltaTime));
    } else if (decision.action === 'turn') {
      this.group.lookAt(decision.lookAt);
    }
  }
}