import { Config } from './Config.js';

export class LightManager {
  constructor(scene) {
    const { ambient, hemi, moon } = Config.LIGHTS;

    // Luz ambiente mínima para manter o breu da cripta
    this.ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);
    scene.add(this.ambientLight);

    // Gradiente sutil entre teto e chão
    this.hemiLight = new THREE.HemisphereLight(hemi.sky, hemi.ground, hemi.intensity);
    scene.add(this.hemiLight);

    // Luar fraco apenas para recortar as bordas superiores das paredes
    this.moonLight = new THREE.DirectionalLight(moon.color, moon.intensity);
    this.moonLight.position.set(...moon.pos);
    scene.add(this.moonLight);
    scene.add(this.moonLight.target);
  }
}