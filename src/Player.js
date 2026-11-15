import { Config } from './Config.js';
import { Input } from './Input.js';

const addMesh = (geo, mat, parent, [x, y, z], [rx, ry, rz] = [0, 0, 0]) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  parent.add(m);
  return m;
};

export class Player {
  constructor(scene, levelMap) {
    this.level = levelMap;
    this.group = new THREE.Group();
    this.group.position.copy(this.level.cellToWorld(3, 3));
    this.group.rotation.y = Math.PI; // Inicia olhando para o Norte (-Z)
    scene.add(this.group);

    this.walkTimer = 0;
    this.isFirstPerson = false;
    this.buildModel();
  }

  buildModel() {
    const { playerSkin: cS, playerClothes: cC, playerLeather: cL, buckle: cB } = Config.COLORS;
    const mat = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
    const mEye = new THREE.MeshBasicMaterial({ color: 0x0f0f15 });

    // Tronco e Acessórios
    this.torso = addMesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), mat(cC, 0.8), this.group, [0, 1.4, 0]);
    this.belt = addMesh(new THREE.BoxGeometry(0.85, 0.12, 0.55), mat(cL, 0.9), this.torso, [0, -0.45, 0]);
    this.buckle = addMesh(new THREE.BoxGeometry(0.15, 0.1, 0.05), mat(cB, 0.4), this.torso, [0, -0.45, 0.29]);

    // Cabeça
    this.head = addMesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat(cS, 0.7), this.torso, [0, 1.0, 0]);
    addMesh(new THREE.BoxGeometry(0.1, 0.08, 0.02), mEye, this.head, [-0.12, 0.1, 0.26]);
    addMesh(new THREE.BoxGeometry(0.1, 0.08, 0.02), mEye, this.head, [0.12, 0.1, 0.26]);

    // Membros Articulados
    const legGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3).translate(0, -0.45, 0);
    const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25).translate(0, -0.4, 0);
    const handGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);

    this.leftLeg = addMesh(legGeo, mat(cC, 0.8), this.torso, [-0.25, -0.6, 0]);
    this.rightLeg = addMesh(legGeo, mat(cC, 0.8), this.torso, [0.25, -0.6, 0]);
    this.leftArm = addMesh(armGeo, mat(cC, 0.8), this.torso, [-0.55, 0.5, 0]);
    this.rightArm = addMesh(armGeo, mat(cC, 0.8), this.torso, [0.55, 0.5, 0]);
    addMesh(handGeo, mat(cS, 0.7), this.leftArm, [0, -0.85, 0]);
    addMesh(handGeo, mat(cS, 0.7), this.rightArm, [0, -0.85, 0]);

    // Tocha Texturizada e Fonte de Luz
    const tex = new THREE.TextureLoader().load(Config.TEXTURES.wood);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);

    const torch = addMesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.7),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }),
      this.rightArm,
      [0, -0.8, 0.3],
      [Math.PI / 4, 0, 0]
    );

    const t = Config.LIGHTS.torch;
    this.torchLight = new THREE.PointLight(t.color, t.intensity, t.distance, t.decay);
    this.torchLight.position.set(0, 0.45, 0);
    this.torchLight.castShadow = true;
    this.torchLight.shadow.bias = -0.0005;
    torch.add(this.torchLight);
  }

  setFirstPersonView(enabled) {
    this.isFirstPerson = enabled;

    // Esconde o próprio corpo para não obstruir a câmera, mantendo o braço da tocha visível
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

  checkCol(pos) {
    const box = new THREE.Box3().setFromCenterAndSize(pos.clone().setY(1), new THREE.Vector3(1.1, 1.8, 1.1));
    return this.level.wallsBoxes.some(w => w.intersectsBox(box));
  }

  update(deltaTime, cameraMode = 1) {
    const pos = this.group.position;
    let isMoving = false;

    if (cameraMode === 3) {
      // 1ª Pessoa: W/S anda para frente/trás; A/D, setas ou mouse giram a visão suavemente
      const turnInput =
        (Input.isPressed('a') || Input.isPressed('arrowleft')) -
        (Input.isPressed('d') || Input.isPressed('arrowright'));
      const mouseDx = Input.consumeMouseX();

      this.group.rotation.y += turnInput * Config.PLAYER.turnSpeed * deltaTime;
      this.group.rotation.y -= mouseDx * Config.PLAYER.mouseSensitivity;

      const forwardInput =
        (Input.isPressed('w') || Input.isPressed('arrowup')) -
        (Input.isPressed('s') || Input.isPressed('arrowdown'));

      if (forwardInput !== 0) {
        const dirX = Math.sin(this.group.rotation.y);
        const dirZ = Math.cos(this.group.rotation.y);
        const step = forwardInput * Config.PLAYER.speed * deltaTime;

        const vx = dirX * step;
        const vz = dirZ * step;

        if (!this.checkCol(pos.clone().add(new THREE.Vector3(vx, 0, 0)))) pos.x += vx;
        if (!this.checkCol(pos.clone().add(new THREE.Vector3(0, 0, vz)))) pos.z += vz;

        isMoving = true;
      }
    } else {
      // 3ª Pessoa e Top-Down: movimento direcional pelos eixos do mapa
      Input.consumeMouseX();
      const mx =
        (Input.isPressed('d') || Input.isPressed('arrowright')) -
        (Input.isPressed('a') || Input.isPressed('arrowleft'));
      const mz =
        (Input.isPressed('s') || Input.isPressed('arrowdown')) -
        (Input.isPressed('w') || Input.isPressed('arrowup'));

      if (mx !== 0 || mz !== 0) {
        const vec = new THREE.Vector3(mx, 0, mz).normalize().multiplyScalar(Config.PLAYER.speed * deltaTime);

        if (!this.checkCol(pos.clone().add(new THREE.Vector3(vec.x, 0, 0)))) pos.x += vec.x;
        if (!this.checkCol(pos.clone().add(new THREE.Vector3(0, 0, vec.z)))) pos.z += vec.z;

        this.group.rotation.y = Math.atan2(vec.x, vec.z);
        isMoving = true;
      }
    }

    if (isMoving) {
      this.walkTimer += deltaTime * 10;
    } else {
      this.walkTimer = 0;
    }

    const w = this.walkTimer;
    this.leftLeg.rotation.x = Math.sin(w) * 0.7;
    this.rightLeg.rotation.x = -Math.sin(w) * 0.7;
    this.leftArm.rotation.x = -Math.sin(w) * 0.6;
    this.rightArm.rotation.x = (this.isFirstPerson ? -0.35 : 0) + Math.sin(w) * (this.isFirstPerson ? 0.08 : 0.3);

    // Oscilação física da tocha (flicker)
    if (Config.LIGHTS.torch.flicker && this.torchLight.visible) {
      this.torchLight.intensity = Config.LIGHTS.torch.intensity +
        Math.sin(Date.now() * 0.015) * 0.35 +
        Math.cos(Date.now() * 0.03) * 0.15;
    }
  }
}