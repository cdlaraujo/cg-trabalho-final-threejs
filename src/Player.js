import { Config } from './Config.js';
import { Input } from './UI.js';
import { Entity, loadTexture, updateTorchFlicker } from './Entity.js';

const isPressed = (a, b) => Input.isPressed(a) || Input.isPressed(b);
const getAxis = (posA, posB, negA, negB) =>
  (isPressed(posA, posB) ? 1 : 0) - (isPressed(negA, negB) ? 1 : 0);

export class Player extends Entity {
  constructor(scene, levelMap) {
    super(scene, levelMap, Config.PLAYER.startCell);
    this.group.rotation.y = Math.PI; // Inicia olhando para o Norte

    this.walkTimer = 0;
    this.flickerTimer = 0;
    this.stamina = Config.PLAYER.maxStamina;
    this.isExhausted = false;
    this.isSprinting = false;
    this.isMoving = false;
    this.isFirstPerson = false;

    this.buildModel();
  }

  buildModel() {
    const skinMat = new THREE.MeshStandardMaterial({ color: Config.COLORS.playerSkin, roughness: 0.7 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: Config.COLORS.playerClothes, roughness: 0.8 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: Config.COLORS.playerLeather, roughness: 0.9 });
    const buckleMat = new THREE.MeshStandardMaterial({ color: Config.COLORS.buckle, metalness: 0.6, roughness: 0.4 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f0f15 });

    // Torso usa material clonado para ficar invisível na 1ª pessoa sem ocultar braços/pernas
    this.torso = this.addMesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), clothesMat.clone(), this.group, [0, 1.4, 0]);
    this.belt = this.addMesh(new THREE.BoxGeometry(0.85, 0.12, 0.55), leatherMat, this.torso, [0, -0.45, 0]);
    this.buckle = this.addMesh(new THREE.BoxGeometry(0.15, 0.1, 0.05), buckleMat, this.torso, [0, -0.45, 0.29]);
    this.head = this.addMesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat, this.torso, [0, 1.0, 0]);

    const eyeGeo = new THREE.BoxGeometry(0.1, 0.08, 0.02);
    this.addMesh(eyeGeo, eyeMat, this.head, [-0.12, 0.1, 0.26], false);
    this.addMesh(eyeGeo, eyeMat, this.head, [0.12, 0.1, 0.26], false);

    const legGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3).translate(0, -0.45, 0);
    this.leftLeg = this.addMesh(legGeo, clothesMat, this.torso, [-0.25, -0.6, 0]);
    this.rightLeg = this.addMesh(legGeo, clothesMat, this.torso, [0.25, -0.6, 0]);

    const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25).translate(0, -0.4, 0);
    this.leftArm = this.addMesh(armGeo, clothesMat, this.torso, [-0.55, 0.5, 0]);
    this.rightArm = this.addMesh(armGeo, clothesMat, this.torso, [0.55, 0.5, 0]);

    const handGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    this.addMesh(handGeo, skinMat, this.leftArm, [0, -0.85, 0]);
    this.addMesh(handGeo, skinMat, this.rightArm, [0, -0.85, 0]);

    // Tocha na mão direita
    const torch = this.addMesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.7),
      new THREE.MeshStandardMaterial({ map: loadTexture(Config.TEXTURES.wood, 1, 2), roughness: 0.85 }),
      this.rightArm,
      [0, -0.8, 0.3],
      false
    );
    torch.rotation.x = Math.PI / 4;

    this.torchFlame = this.addMesh(
      new THREE.OctahedronGeometry(0.11, 0),
      new THREE.MeshBasicMaterial({ color: 0xffb347 }),
      torch,
      [0, 0.4, 0],
      false
    );

    const { color, intensity, distance, decay } = Config.LIGHTS.playerTorch;
    this.torchLight = new THREE.PointLight(color, intensity, distance, decay);
    this.torchLight.position.set(0, 0.45, 0);
    this.torchLight.castShadow = true;
    this.torchLight.shadow.mapSize.set(512, 512);
    this.torchLight.shadow.bias = -0.0005;
    torch.add(this.torchLight);
  }

  setFirstPersonView(enabled) {
    if (this.isFirstPerson === enabled) return;
    this.isFirstPerson = enabled;

    this.torso.material.visible = !enabled;
    this.belt.visible = !enabled;
    this.buckle.visible = !enabled;
    this.head.visible = !enabled;
    this.leftLeg.visible = !enabled;
    this.rightLeg.visible = !enabled;
    this.leftArm.visible = !enabled;

    this.rightArm.position.set(...(enabled ? [0.42, 0.45, 0.35] : [0.55, 0.5, 0]));
  }

  checkCollision(targetPos) {
    const r = Config.PLAYER.radius;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(targetPos.x - r, 0.2, targetPos.z - r),
      new THREE.Vector3(targetPos.x + r, 2.0, targetPos.z + r)
    );
    return this.level.wallsBoxes.some((box) => box.intersectsBox(playerBox));
  }

  updateTorch(deltaTime) {
    this.flickerTimer += deltaTime * 9;
    updateTorchFlicker(this.torchLight, this.torchFlame, Config.LIGHTS.playerTorch.intensity, this.flickerTimer, 0, 0.22);
  }

  getMoveDirection(deltaTime, isFP) {
    if (isFP) {
      const turnInput = getAxis('a', 'arrowleft', 'd', 'arrowright');
      this.group.rotation.y += turnInput * Config.PLAYER.turnSpeed * deltaTime - Input.consumeMouseX() * Config.PLAYER.mouseSensitivity;

      const forward = getAxis('w', 'arrowup', 's', 'arrowdown');
      if (forward === 0) return null;

      return new THREE.Vector3(
        Math.sin(this.group.rotation.y) * forward,
        0,
        Math.cos(this.group.rotation.y) * forward
      ).normalize();
    }

    Input.consumeMouseX();
    const moveX = getAxis('d', 'arrowright', 'a', 'arrowleft');
    const moveZ = getAxis('s', 'arrowdown', 'w', 'arrowup');
    if (moveX === 0 && moveZ === 0) return null;

    const moveVec = new THREE.Vector3(moveX, 0, moveZ).normalize();
    this.group.rotation.y = Math.atan2(moveVec.x, moveVec.z);
    return moveVec;
  }

  updateStamina(deltaTime, isMoving) {
    const wantsSprint = Input.isPressed('shift') && isMoving;
    if (wantsSprint && !this.isExhausted && this.stamina > 0) {
      this.isSprinting = true;
      this.stamina = Math.max(0, this.stamina - Config.PLAYER.staminaDrain * deltaTime);
      if (this.stamina === 0) {
        this.isExhausted = true;
        this.isSprinting = false;
      }
    } else {
      this.isSprinting = false;
      this.stamina = Math.min(Config.PLAYER.maxStamina, this.stamina + Config.PLAYER.staminaRegen * deltaTime);
      if (this.isExhausted && this.stamina >= Config.PLAYER.exhaustedThreshold) {
        this.isExhausted = false;
      }
    }
  }

  animateLimbs(deltaTime, isMoving, isFP) {
    const armBaseX = isFP ? -0.35 : 0;
    if (!isMoving) {
      this.walkTimer = 0;
      this.leftLeg.rotation.x = this.rightLeg.rotation.x = this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = armBaseX;
      return;
    }

    const animSpeed = this.isSprinting ? 15 : 10;
    const swingAmp = this.isSprinting ? 0.95 : 0.7;
    this.walkTimer += deltaTime * animSpeed;

    this.leftLeg.rotation.x = Math.sin(this.walkTimer) * swingAmp;
    this.rightLeg.rotation.x = -Math.sin(this.walkTimer) * swingAmp;
    this.leftArm.rotation.x = -Math.sin(this.walkTimer) * (swingAmp * 0.85);
    this.rightArm.rotation.x = armBaseX + Math.sin(this.walkTimer) * (isFP ? 0.08 : 0.25);
  }

  update(deltaTime, cameraMode) {
    const isFP = cameraMode === 2;
    this.setFirstPersonView(isFP);
    this.updateTorch(deltaTime);

    const moveVec = this.getMoveDirection(deltaTime, isFP);
    const isMoving = moveVec !== null;
    this.isMoving = isMoving;
    this.updateStamina(deltaTime, isMoving);

    if (isMoving) {
      const speed = this.isSprinting ? Config.PLAYER.sprintSpeed : Config.PLAYER.speed;
      moveVec.multiplyScalar(speed * deltaTime);

      const targetX = this.group.position.clone().add(new THREE.Vector3(moveVec.x, 0, 0));
      if (!this.checkCollision(targetX)) this.group.position.x = targetX.x;

      const targetZ = this.group.position.clone().add(new THREE.Vector3(0, 0, moveVec.z));
      if (!this.checkCollision(targetZ)) this.group.position.z = targetZ.z;
    }

    this.animateLimbs(deltaTime, isMoving, isFP);
  }
}