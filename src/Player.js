import { Config } from './Config.js';
import { Input } from './Input.js';

export class Player {
  constructor(scene, levelMap) {
    this.level = levelMap;
    this.group = new THREE.Group();

    const { r, c } = Config.PLAYER.startCell;
    this.group.position.copy(this.level.cellToWorld(r, c));
    this.group.rotation.y = Math.PI; // Inicia olhando para o Norte
    scene.add(this.group);

    this.walkTimer = 0;
    this.flickerTimer = 0;
    this.stamina = Config.PLAYER.maxStamina;
    this.isExhausted = false;
    this.isSprinting = false;
    this.isFirstPerson = false;

    this.buildModel();
  }

  buildModel() {
    const skinMat = new THREE.MeshStandardMaterial({ color: Config.COLORS.playerSkin, roughness: 0.7 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: Config.COLORS.playerClothes, roughness: 0.8 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: Config.COLORS.playerLeather, roughness: 0.9 });

    // O material do torso é clonado para podermos deixá-lo invisível na 1ª pessoa sem afetar pernas/braços
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), clothesMat.clone());
    this.torso.position.y = 1.4;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    this.belt = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.55), leatherMat);
    this.belt.position.y = -0.45;
    this.belt.castShadow = true;
    this.torso.add(this.belt);

    this.buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.1, 0.05),
      new THREE.MeshStandardMaterial({ color: Config.COLORS.buckle, metalness: 0.6, roughness: 0.4 })
    );
    this.buckle.position.set(0, -0.45, 0.29);
    this.torso.add(this.buckle);

    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    this.head.position.y = 1.0;
    this.head.castShadow = true;
    this.torso.add(this.head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f0f15 });
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.08, 0.02);

    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.12, 0.1, 0.26);
    this.head.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.12, 0.1, 0.26);
    this.head.add(eyeRight);

    const legGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    legGeo.translate(0, -0.45, 0);

    this.leftLeg = new THREE.Mesh(legGeo, clothesMat);
    this.leftLeg.position.set(-0.25, -0.6, 0);
    this.leftLeg.castShadow = true;
    this.torso.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, clothesMat);
    this.rightLeg.position.set(0.25, -0.6, 0);
    this.rightLeg.castShadow = true;
    this.torso.add(this.rightLeg);

    const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    armGeo.translate(0, -0.4, 0);

    this.leftArm = new THREE.Mesh(armGeo, clothesMat);
    this.leftArm.position.set(-0.55, 0.5, 0);
    this.leftArm.castShadow = true;
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, clothesMat);
    this.rightArm.position.set(0.55, 0.5, 0);
    this.rightArm.castShadow = true;
    this.torso.add(this.rightArm);

    const handGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);

    this.leftHand = new THREE.Mesh(handGeo, skinMat);
    this.leftHand.position.y = -0.85;
    this.leftHand.castShadow = true;
    this.leftArm.add(this.leftHand);

    this.rightHand = new THREE.Mesh(handGeo, skinMat);
    this.rightHand.position.y = -0.85;
    this.rightHand.castShadow = true;
    this.rightArm.add(this.rightHand);

    const textureLoader = new THREE.TextureLoader();
    const woodTexture = textureLoader.load(Config.TEXTURES.wood);
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(1, 2);

    const torch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.7),
      new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.85 })
    );
    torch.position.set(0, -0.8, 0.3);
    torch.rotation.x = Math.PI / 4;
    this.rightArm.add(torch);

    this.torchFlame = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11, 0),
      new THREE.MeshBasicMaterial({ color: 0xffb347 })
    );
    this.torchFlame.position.set(0, 0.4, 0);
    torch.add(this.torchFlame);

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

    // Esconde o próprio corpo mantendo a tocha visível no braço deslocado
    this.torso.material.visible = !enabled;
    this.belt.visible = !enabled;
    this.buckle.visible = !enabled;
    this.head.visible = !enabled;
    this.leftLeg.visible = !enabled;
    this.rightLeg.visible = !enabled;
    this.leftArm.visible = !enabled;

    if (enabled) {
      this.rightArm.position.set(0.42, 0.45, 0.35);
    } else {
      this.rightArm.position.set(0.55, 0.5, 0);
    }
  }

  checkCollision(targetPos) {
    const r = Config.PLAYER.radius;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(targetPos.x - r, 0.2, targetPos.z - r),
      new THREE.Vector3(targetPos.x + r, 2.0, targetPos.z + r)
    );
    for (const box of this.level.wallsBoxes) {
      if (box.intersectsBox(playerBox)) return true;
    }
    return false;
  }

  update(deltaTime, cameraMode) {
    this.setFirstPersonView(cameraMode === 2); // 2 é Primeira Pessoa no CameraManager atual

    // Oscilação natural da tocha
    this.flickerTimer += deltaTime * 9;
    const flicker = Math.sin(this.flickerTimer) * 0.22 + Math.cos(this.flickerTimer * 2.7) * 0.12;
    this.torchLight.intensity = Config.LIGHTS.playerTorch.intensity + flicker;
    const flameScale = 1 + flicker * 0.35;
    this.torchFlame.scale.set(flameScale, flameScale * 1.3, flameScale);

    let isMoving = false;
    const moveVec = new THREE.Vector3(0, 0, 0);

    if (cameraMode === 2) {
      // 1ª Pessoa: Jogabilidade Tank/FPS (Mouse + A/D rotacionam, W/S andam p/ frente)
      const turnInput = (Input.isPressed('a') || Input.isPressed('arrowleft') ? 1 : 0) -
                        (Input.isPressed('d') || Input.isPressed('arrowright') ? 1 : 0);
      const mouseDx = Input.consumeMouseX();
      
      const turnSpeed = Config.PLAYER.turnSpeed || 2.6;
      this.group.rotation.y += turnInput * turnSpeed * deltaTime;
      this.group.rotation.y -= mouseDx * Config.PLAYER.mouseSensitivity;

      const forwardInput = (Input.isPressed('w') || Input.isPressed('arrowup') ? 1 : 0) -
                           (Input.isPressed('s') || Input.isPressed('arrowdown') ? 1 : 0);

      if (forwardInput !== 0) {
        const dirX = Math.sin(this.group.rotation.y);
        const dirZ = Math.cos(this.group.rotation.y);
        moveVec.set(dirX * forwardInput, 0, dirZ * forwardInput).normalize();
        isMoving = true;
      }
    } else {
      // 3ª Pessoa: Jogabilidade Isométrica (Movimento direcional absoluto)
      Input.consumeMouseX(); 
      let moveX = 0; let moveZ = 0;
      
      if (Input.isPressed('w') || Input.isPressed('arrowup')) moveZ -= 1;
      if (Input.isPressed('s') || Input.isPressed('arrowdown')) moveZ += 1;
      if (Input.isPressed('a') || Input.isPressed('arrowleft')) moveX -= 1;
      if (Input.isPressed('d') || Input.isPressed('arrowright')) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        moveVec.set(moveX, 0, moveZ).normalize();
        this.group.rotation.y = Math.atan2(moveVec.x, moveVec.z);
        isMoving = true;
      }
    }

    // Gestão da Stamina
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

    const currentSpeed = this.isSprinting ? Config.PLAYER.sprintSpeed : Config.PLAYER.speed;

    // Aplica movimento físico e animações
    if (isMoving) {
      moveVec.multiplyScalar(currentSpeed * deltaTime);

      const targetX = this.group.position.clone().add(new THREE.Vector3(moveVec.x, 0, 0));
      if (!this.checkCollision(targetX)) this.group.position.x = targetX.x;

      const targetZ = this.group.position.clone().add(new THREE.Vector3(0, 0, moveVec.z));
      if (!this.checkCollision(targetZ)) this.group.position.z = targetZ.z;

      const animSpeed = this.isSprinting ? 15 : 10;
      const swingAmp = this.isSprinting ? 0.95 : 0.7;
      this.walkTimer += deltaTime * animSpeed;
      
      this.leftLeg.rotation.x = Math.sin(this.walkTimer) * swingAmp;
      this.rightLeg.rotation.x = -Math.sin(this.walkTimer) * swingAmp;
      this.leftArm.rotation.x = -Math.sin(this.walkTimer) * (swingAmp * 0.85);
      
      const armRotYOffset = cameraMode === 2 ? -0.35 : 0;
      const armSwingMult = cameraMode === 2 ? 0.08 : 0.25;
      this.rightArm.rotation.x = armRotYOffset + Math.sin(this.walkTimer) * armSwingMult;
    } else {
      this.walkTimer = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = cameraMode === 2 ? -0.35 : 0;
    }
  }
}