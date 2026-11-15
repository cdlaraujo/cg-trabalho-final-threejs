import { Config } from './Config.js';

const addMesh = (geo, mat, parent, [x, y, z]) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
};

// ==========================================
// LÓGICA DE JOGO (IA / Pathfinding)
// ==========================================
class GuardianAI {
  constructor(levelMap, startRow, startCol, speed) {
    this.level = levelMap;
    this.speed = speed;
    this.gridPos = { r: startRow, c: startCol };
    this.prevGridPos = { r: startRow, c: startCol };
    this.targetPos = this.level.cellToWorld(startRow, startCol);
  }

  calculateNextMove(currentPos, playerPos) {
    const distToTarget = currentPos.distanceTo(this.targetPos);

    if (distToTarget < 0.05) {
      currentPos.copy(this.targetPos); 
      
      const candidates = [
        { r: this.gridPos.r - 1, c: this.gridPos.c },
        { r: this.gridPos.r + 1, c: this.gridPos.c },
        { r: this.gridPos.r, c: this.gridPos.c - 1 },
        { r: this.gridPos.r, c: this.gridPos.c + 1 }
      ];

      let validMoves = candidates.filter(n => 
        this.level.grid[n.r] !== undefined && this.level.grid[n.r][n.c] === 0
      );

      if (validMoves.length > 1) {
        validMoves = validMoves.filter(n => !(n.r === this.prevGridPos.r && n.c === this.prevGridPos.c));
      }

      if (validMoves.length > 0) {
        let bestMove = validMoves[0];
        let minDistance = Infinity;

        validMoves.forEach(move => {
          const moveWorldPos = this.level.cellToWorld(move.r, move.c);
          const distToPlayer = moveWorldPos.distanceTo(playerPos);
          if (distToPlayer < minDistance) {
            minDistance = distToPlayer;
            bestMove = move;
          }
        });

        this.prevGridPos = { ...this.gridPos };
        this.gridPos = bestMove;
        this.targetPos = this.level.cellToWorld(bestMove.r, bestMove.c);
        return { action: 'turn', lookAt: this.targetPos };
      }
    } else {
      const dir = new THREE.Vector3().subVectors(this.targetPos, currentPos).normalize();
      return { action: 'move', vector: dir };
    }
    return { action: 'idle' };
  }
}

// ==========================================
// LÓGICA DE CG (Renderização / Three.js)
// ==========================================
export class Guardian {
  constructor(scene, levelMap, player, startRow = 1, startCol = 3) {
    this.scene = scene;
    this.player = player;
    this.group = new THREE.Group();
    
    this.ai = new GuardianAI(levelMap, startRow, startCol, 2.6);
    
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
    addMesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), eyeMat, this.torso, [-0.35, 0.4, 0.52]);
    addMesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), eyeMat, this.torso, [0.35, 0.4, 0.52]);
    this.core = addMesh(new THREE.OctahedronGeometry(0.25), eyeMat, this.torso, [0, 0.05, 0.55]);

    const armGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5).translate(0, -0.7, 0);
    const legGeo = new THREE.BoxGeometry(0.6, 1.0, 0.7).translate(0, -0.5, 0);

    this.leftArm = addMesh(armGeo, mat, this.torso, [-1.1, 0.6, 0]);
    this.rightArm = addMesh(armGeo, mat, this.torso, [1.1, 0.6, 0]);
    this.leftLeg = addMesh(legGeo, mat, this.torso, [-0.5, -0.9, 0]);
    this.rightLeg = addMesh(legGeo, mat, this.torso, [0.5, -0.9, 0]);
  }

  update(deltaTime) {
    // 1. Atualiza CG (Animação procedural)
    this.animationTimer += deltaTime * 2.5;
    const t = this.animationTimer;
    this.torso.position.y = 2.0 + Math.sin(t * 1.2) * 0.15;
    this.leftArm.rotation.x = Math.sin(t) * 0.4;
    this.rightArm.rotation.x = -Math.sin(t) * 0.4;
    this.core.rotation.y += deltaTime * 1.5;

    // 2. Consulta a IA e aplica o resultado na Física
    const decision = this.ai.calculateNextMove(this.group.position, this.player.group.position);
    
    if (decision.action === 'move') {
      this.group.position.add(decision.vector.multiplyScalar(this.ai.speed * deltaTime));
    } else if (decision.action === 'turn') {
      this.group.lookAt(decision.lookAt);
    }
  }
}