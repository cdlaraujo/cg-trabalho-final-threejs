export const Config = {
  // Configurações do Motor
  CAMERA: {
    fov: 60,
    near: 0.1,
    far: 1000
  },
  
  // Parâmetros de Jogo
  PLAYER: {
    speed: 5.0,
    radius: 0.55
  },

  // Matriz Lógica do Mapa e Tamanho dos Blocos
  LEVEL: {
    blockSize: 4,
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ]
  },

  // Paleta de Cores Centralizada
  COLORS: {
    background: 0x050508,
    fog: 0x050508,
    ambientLight: 0x2a3550,
    hemiSky: 0x4a6fa5,
    hemiGround: 0x1a202c,
    directionalLight: 0xa0b8e0,
    torchLight: 0xed8936,
    floor: 0x161b22,
    wall: 0x2d3748,
    golem: 0x4a5568,
    golemEye: 0xe53e3e,
    playerSkin: 0x718096,
    playerClothes: 0x2b6cb0,
    playerLeather: 0x2d3748,
    buckle: 0xd69e2e
  },

  // Caminhos dos Assets
  TEXTURES: {
    floor: './assets/textures/floor_tiles.png',
    wall: './assets/textures/wall_bricks.png',
    golem: './assets/textures/golem_rock.png',
    wood: './assets/textures/wood.png'
  }
};