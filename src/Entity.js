export class Entity {
  constructor(scene, levelMap, startCell) {
    this.scene = scene;
    this.level = levelMap;
    this.group = new THREE.Group();
    this.group.position.copy(this.level.cellToWorld(startCell.r, startCell.c));
    this.scene.add(this.group);
  }

  addMesh(geo, mat, parent = this.group, pos = [0, 0, 0], castShadow = true) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.castShadow = mesh.receiveShadow = castShadow;
    parent.add(mesh);
    return mesh;
  }
}