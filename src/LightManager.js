import { Config } from './Config.js';

export class LightManager {
  constructor(scene) {
    const { ambient, hemi, moon } = Config.LIGHTS;

    // Luz ambiente para preenchimento de penumbra
    this.ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);
    scene.add(this.ambientLight);

    // Hemisfério (gradiente teto/chão)
    this.hemiLight = new THREE.HemisphereLight(hemi.sky, hemi.ground, hemi.intensity);
    scene.add(this.hemiLight);

    // Luz noturna direcional com projeção de sombras
    this.moonLight = new THREE.DirectionalLight(moon.color, moon.intensity);
    this.moonLight.position.set(...moon.pos);
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