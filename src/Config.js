export const Config = {
  CAMERA: {
    fov: 60,
    firstPersonFov: 75, // Ângulo de visão maior para não dar enjoo
    near: 0.1,
    far: 1000
  },

  PLAYER: {
    startCell: { r: 7, c: 7 },
    speed: 4.8,
    sprintSpeed: 8.2,
    radius: 0.52,
    maxStamina: 100,
    staminaDrain: 45,
    staminaRegen: 22,
    exhaustedThreshold: 25,
    turnSpeed: 2.6,
    mouseSensitivity: 0.003 // Velocidade do giro da câmera
  },

  GUARDIAN: {
    spawns: [
      { r: 1,  c: 7,  color: 0xff2a2a }, // Norte - Carmesim
      { r: 13, c: 7,  color: 0xc026d3 }, // Sul   - Violeta
      { r: 7,  c: 1,  color: 0x22c55e }, // Oeste - Esmeralda
      { r: 7,  c: 13, color: 0x3b82f6 }  // Leste - Safira
    ],
    catchRadius: 1.75,
    searchDuration: 4.5,
    difficultyTiers: [
      { patrolSpeed: 2.4, huntSpeed: 4.1, visionRange: 16, walkHearing: 5.5, sprintHearing: 11.0, coreIntensity: 1.2, intercept: false },
      { patrolSpeed: 2.8, huntSpeed: 4.5, visionRange: 19, walkHearing: 6.5, sprintHearing: 13.0, coreIntensity: 1.8, intercept: false },
      { patrolSpeed: 3.3, huntSpeed: 5.0, visionRange: 22, walkHearing: 7.5, sprintHearing: 15.0, coreIntensity: 2.5, intercept: true  },
      { patrolSpeed: 3.8, huntSpeed: 5.5, visionRange: 26, walkHearing: 9.0, sprintHearing: 17.5, coreIntensity: 3.4, intercept: true  }
    ]
  },

  RELICS: {
    total: 4,
    spawnCells: [
      { r: 1, c: 1 }, { r: 1, c: 13 }, { r: 13, c: 1 }, { r: 13, c: 13 }
    ]
  },

  LEVEL: {
    blockSize: 4,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    wallTorches: [
      { r: 2, c: 7, dir: 'S' }, { r: 12, c: 7, dir: 'N' },
      { r: 7, c: 6, dir: 'N' }, { r: 7, c: 8, dir: 'S' },
      { r: 4, c: 4, dir: 'S' }, { r: 4, c: 10, dir: 'S' },
      { r: 10, c: 4, dir: 'N' }, { r: 10, c: 10, dir: 'N' }
    ]
  },

  COLORS: {
    background: 0x010102,
    fog: 0x010102,
    playerSkin: 0x718096,
    playerClothes: 0x2b6cb0,
    playerLeather: 0x2d3748,
    buckle: 0xd69e2e,
    relic: 0x00f5d4
  },

  TEXTURES: {
    floor: './assets/textures/floor_tiles.png',
    wall: './assets/textures/wall_bricks.png',
    golem: './assets/textures/golem_rock.png',
    wood: './assets/textures/wood.png'
  },

  LIGHTS: {
    exposure: 0.85,          // Reduzido para não estourar a soma das luzes
    fogDensity: 0.05,
    ambient: { color: 0x070a12, intensity: 0.02 }, // Quase nula
    hemi:    { sky: 0x121a2b, ground: 0x020204, intensity: 0.03 },
    moon:    { color: 0x3b5284, intensity: 0.08, pos: [12, 24, 10] },
    playerTorch: { color: 0xed8936, intensity: 3.4, distance: 15, decay: 2 },
    wallTorch: { color: 0xff7b29, intensity: 1.5, distance: 11, decay: 2 } // Mais fracas
  }
};