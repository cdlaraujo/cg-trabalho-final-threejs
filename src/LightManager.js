import { Config } from './Config.js';

export class LightManager {
  constructor(scene) {
    this.ambientLight = new THREE.AmbientLight(Config.COLORS.ambientLight, 0.55);
    scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(Config.COLORS.hemiSky, Config.COLORS.hemiGround, 0.7);
    scene.add(this.hemiLight);

    this.moonLight = new THREE.DirectionalLight(Config.COLORS.directionalLight, 0.85);
    this.moonLight.position.set(8, 16, 6);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.set(1024, 1024);
    this.moonLight.shadow.camera.left = -20;
    this.moonLight.shadow.camera.right = 20;
    this.moonLight.shadow.camera.top = 20;
    this.moonLight.shadow.camera.bottom = -20;
    this.moonLight.shadow.camera.near = 0.5;
    this.moonLight.shadow.camera.far = 50;
    this.moonLight.shadow.bias = -0.0005;
    scene.add(this.moonLight);
    scene.add(this.moonLight.target);
  }

  toggle(lightType) {
    if (lightType === 'ambient') this.ambientLight.visible = !this.ambientLight.visible;
    if (lightType === 'hemi') this.hemiLight.visible = !this.hemiLight.visible;
    if (lightType === 'moon') this.moonLight.visible = !this.moonLight.visible;
  }
}