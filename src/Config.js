export const Config = {
  CAMERA: {
    fov: 60,
    near: 0.1,
    far: 1000
  },

  PLAYER: {
    speed: 5.0,
    radius: 0.55
  },

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

  COLORS: {
    background: 0x050508,
    fog: 0x050508,
    floor: 0x161b22,
    wall: 0x2d3748,
    golem: 0x4a5568,
    golemEye: 0xe53e3e,
    playerSkin: 0x718096,
    playerClothes: 0x2b6cb0,
    playerLeather: 0x2d3748,
    buckle: 0xd69e2e
  },

  TEXTURES: {
    floor: './assets/textures/floor_tiles.png',
    wall: './assets/textures/wall_bricks.png',
    golem: './assets/textures/golem_rock.png',
    wood: './assets/textures/wood.png'
  },

  // Central de Iluminação
  LIGHTS: {
    exposure: 1.1,
    ambient: { color: 0x0a0e17, intensity: 0.15 },
    hemi:    { sky: 0x1e293b, ground: 0x050508, intensity: 0.2 },
    moon:    { color: 0x5c7cfa, intensity: 0.35, pos: [8, 16, 6] },
    torch: {
      color: 0xed8936,
      intensity: 3.2,
      distance: 14,
      decay: 2,         // Decaimento quadrático físico
      flicker: true     // Oscilação procedural de chama
    }
  }
};