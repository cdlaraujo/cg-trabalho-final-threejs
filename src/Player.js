export class Player {
  constructor(scene, levelMap) {
    this.level = levelMap;

    this.group = new THREE.Group();
    this.group.position.copy(this.level.cellToWorld(3, 3));
    scene.add(this.group);

    this.walkTimer = 0;
    this.buildModel();
    this.setupInputs();
  }

  buildModel() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.7 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.8 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9 });

    // ---------- TRONCO ----------
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), clothesMat);
    this.torso.position.y = 1.4;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Cinto (detalhe de caracterização — 1 primitiva nova)
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.55), leatherMat);
    belt.position.y = -0.45;
    belt.castShadow = true;
    this.torso.add(belt);

    // Fivela central (pequena, reforça a leitura do cinto)
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.1, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xd69e2e, metalness: 0.6, roughness: 0.4 })
    );
    buckle.position.set(0, -0.45, 0.29);
    this.torso.add(buckle);

    // ---------- CABEÇA ----------
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    head.position.y = 1.0;
    head.castShadow = true;
    this.torso.add(head);

    // Olhos (2 primitivas novas — MeshBasicMaterial p/ brilhar na escuridão)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f0f15 });
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.08, 0.02);

    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.12, 0.1, 0.26);
    head.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.12, 0.1, 0.26);
    head.add(eyeRight);

    // ---------- PERNAS ----------
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

    // ---------- BRAÇOS ----------
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

    // Mãos (2 primitivas novas — herdam o balanço da caminhada)
    const handGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);

    this.leftHand = new THREE.Mesh(handGeo, skinMat);
    this.leftHand.position.y = -0.85;
    this.leftHand.castShadow = true;
    this.leftArm.add(this.leftHand);

    this.rightHand = new THREE.Mesh(handGeo, skinMat);
    this.rightHand.position.y = -0.85;
    this.rightHand.castShadow = true;
    this.rightArm.add(this.rightHand);

    // ---------- TOCHA ----------
    const torch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x744210, roughness: 0.9 })
    );
    torch.position.set(0, -0.8, 0.3);
    torch.rotation.x = Math.PI / 4;
    this.rightArm.add(torch);

    this.torchLight = new THREE.PointLight(0xed8936, 2.6, 16, 1.5);
    this.torchLight.position.set(0, 0.45, 0);
    this.torchLight.castShadow = true;
    this.torchLight.shadow.mapSize.set(512, 512);
    this.torchLight.shadow.bias = -0.0005;
    torch.add(this.torchLight);
  }

  setupInputs() {
    this.keys = { w: false, a: false, s: false, d: false };
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(k)) this.keys[k] = true;
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(k)) this.keys[k] = false;
    });
  }

  checkCollision(targetPos) {
    const playerRadius = 0.55;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(targetPos.x - playerRadius, 0.2, targetPos.z - playerRadius),
      new THREE.Vector3(targetPos.x + playerRadius, 2.0, targetPos.z + playerRadius)
    );
    for (let box of this.level.wallsBoxes) {
      if (box.intersectsBox(playerBox)) return true;
    }
    return false;
  }

  update(deltaTime) {
    const moveSpeed = 5.0;
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.w) moveZ -= 1;
    if (this.keys.s) moveZ += 1;
    if (this.keys.a) moveX -= 1;
    if (this.keys.d) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      const moveVec = new THREE.Vector3(moveX, 0, moveZ)
        .normalize()
        .multiplyScalar(moveSpeed * deltaTime);

      const targetX = this.group.position.clone().add(new THREE.Vector3(moveVec.x, 0, 0));
      if (!this.checkCollision(targetX)) this.group.position.x = targetX.x;

      const targetZ = this.group.position.clone().add(new THREE.Vector3(0, 0, moveVec.z));
      if (!this.checkCollision(targetZ)) this.group.position.z = targetZ.z;

      this.group.rotation.y = Math.atan2(moveVec.x, moveVec.z);

      this.walkTimer += deltaTime * 10;
      this.leftLeg.rotation.x = Math.sin(this.walkTimer) * 0.7;
      this.rightLeg.rotation.x = -Math.sin(this.walkTimer) * 0.7;
      this.leftArm.rotation.x = -Math.sin(this.walkTimer) * 0.6;
      this.rightArm.rotation.x = Math.sin(this.walkTimer) * 0.3;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }
  }
}