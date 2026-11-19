import { Config } from './Config.js';
import { GuardianAI } from './GuardianAI.js';
import { Entity } from './Entity.js';

export class Guardian extends Entity {
  constructor(scene, levelMap, player) {
    const { r, c } = Config.GUARDIAN.startCell;
    super(scene, levelMap, { r, c });

    this.player = player;
    this.ai = new GuardianAI(levelMap, r, c);
    this.animationTimer = 0;
    this.buildModel();
  }

  buildModel() {
    const tex = new THREE.TextureLoader().load(Config.TEXTURES.golem);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.2 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: Config.COLORS.golemEye });

    this.torso = this.addMesh(new THREE.BoxGeometry(1.6, 1.8, 1.0), mat, this.group, [0, 2.0, 0]);
    this.addMesh(new THREE.BoxGeometry(0.22, 0.11, 0.1), eyeMat, this.torso, [-0.35, 0.4, 0.52]);
    this.addMesh(new THREE.BoxGeometry(0.22, 0.11, 0.1), eyeMat, this.torso, [0.35, 0.4, 0.52]);
    this.core = this.addMesh(new THREE.OctahedronGeometry(0.28), eyeMat, this.torso, [0, 0.05, 0.55]);

    this.coreLight = new THREE.PointLight(Config.COLORS.golemEye, 1.2, 9, 2);
    this.coreLight.position.set(0, 0.05, 0.9);
    this.torso.add(this.coreLight);

    const armGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5).translate(0, -0.7, 0);
    const legGeo = new THREE.BoxGeometry(0.6, 1.0, 0.7).translate(0, -0.5, 0);

    this.leftArm = this.addMesh(armGeo, mat, this.torso, [-1.1, 0.6, 0]);
    this.rightArm = this.addMesh(armGeo, mat, this.torso, [1.1, 0.6, 0]);
    this.leftLeg = this.addMesh(legGeo, mat, this.torso, [-0.5, -0.9, 0]);
    this.rightLeg = this.addMesh(legGeo, mat, this.torso, [0.5, -0.9, 0]);
  }

  onRelicCollected(collectedCount) {
    this.ai.setDifficulty(collectedCount);
  }

  getState() {
    return this.ai.state;
  }

  update(deltaTime) {
    const decision = this.ai.calculateNextMove(this.group.position, this.player, deltaTime);

    this.animationTimer += deltaTime * (decision.speed * 0.95);
    const t = this.animationTimer;

    this.torso.position.y = 2.0 + Math.sin(t * 1.2) * 0.15;
    this.leftArm.rotation.x = Math.sin(t) * 0.45;
    this.rightArm.rotation.x = -Math.sin(t) * 0.45;
    this.core.rotation.y += deltaTime * (this.ai.state === 'HUNT' ? 5.0 : 1.8);

    const huntBoost = this.ai.state === 'HUNT' ? 1.0 : 0.0;
    this.coreLight.intensity = this.ai.tier.coreIntensity + huntBoost + Math.sin(t * 2.5) * 0.35;

    if (decision.action === 'move') {
      this.group.position.add(decision.vector.multiplyScalar(decision.speed * deltaTime));
    } else if (decision.action === 'turn') {
      this.group.lookAt(decision.lookAt);
    }
  }
}