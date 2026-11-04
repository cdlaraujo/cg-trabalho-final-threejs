export class Guardian {
  constructor(scene, initialPosition = new THREE.Vector3(0, 0, -4)) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.copy(initialPosition);
    this.scene.add(this.group);
    this.animationTimer = 0;
    this.buildModel();
  }

  buildModel() {
    const golemMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.9, metalness: 0.2 });

    this.torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.0), golemMat);
    this.torso.position.y = 2.0;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.group.add(this.torso);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe53e3e });
    const eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), eyeMat);
    eyeLeft.position.set(-0.35, 0.4, 0.52);
    this.torso.add(eyeLeft);

    const eyeRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), eyeMat);
    eyeRight.position.set(0.35, 0.4, 0.52);
    this.torso.add(eyeRight);

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), new THREE.MeshBasicMaterial({ color: 0xe53e3e }));
    core.position.set(0, 0.05, 0.55);
    this.torso.add(core);
    this.core = core;

    const armGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5);
    armGeo.translate(0, -0.7, 0);

    this.leftArm = new THREE.Mesh(armGeo, golemMat);
    this.leftArm.position.set(-1.1, 0.6, 0);
    this.leftArm.castShadow = true;
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, golemMat);
    this.rightArm.position.set(1.1, 0.6, 0);
    this.rightArm.castShadow = true;
    this.torso.add(this.rightArm);

    const legGeo = new THREE.BoxGeometry(0.6, 1.0, 0.7);
    legGeo.translate(0, -0.5, 0);

    this.leftLeg = new THREE.Mesh(legGeo, golemMat);
    this.leftLeg.position.set(-0.5, -0.9, 0);
    this.leftLeg.castShadow = true;
    this.torso.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, golemMat);
    this.rightLeg.position.set(0.5, -0.9, 0);
    this.rightLeg.castShadow = true;
    this.torso.add(this.rightLeg);
  }

  update(deltaTime) {
    this.animationTimer += deltaTime * 2.5;
    this.torso.position.y = 2.0 + Math.sin(this.animationTimer * 1.2) * 0.15;
    this.leftArm.rotation.x = Math.sin(this.animationTimer) * 0.4;
    this.rightArm.rotation.x = -Math.sin(this.animationTimer) * 0.4;
    if (this.core) this.core.rotation.y += deltaTime * 1.5;
  }
}