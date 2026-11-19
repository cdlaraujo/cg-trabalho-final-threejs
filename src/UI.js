import { Config } from './Config.js';

const $ = (id) => document.getElementById(id);

const GUARDIAN_STATUS = {
  HUNT:   { text: 'CAÇANDO VOCÊ!', cls: 'state-hunt' },
  SEARCH: { text: 'Procurando...', cls: 'state-search' },
  PATROL: { text: 'Patrulhando',   cls: 'state-patrol' }
};

export const Input = {
  keys: {},
  mouseDeltaX: 0,

  init() {
    window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) this.mouseDeltaX += e.movementX || 0;
    });
  },

  isPressed(key) {
    return !!this.keys[key.toLowerCase()];
  },

  consumeMouseX() {
    const dx = this.mouseDeltaX;
    this.mouseDeltaX = 0;
    return dx;
  }
};

export const HUD = {
  cam: $('ui-cam'),
  score: $('ui-score'),
  staminaBar: $('ui-stamina-bar'),
  guardianState: $('ui-guardian-state'),
  vignette: $('danger-vignette'),
  victoryScreen: $('victory'),
  gameOverScreen: $('game-over'),

  update(player, guardianState, distToGuardian) {
    const staminaPct = (player.stamina / Config.PLAYER.maxStamina) * 100;
    this.staminaBar.style.width = `${staminaPct}%`;
    this.staminaBar.style.backgroundColor = player.isExhausted ? '#e53e3e' : '#38b2ac';

    const status = GUARDIAN_STATUS[guardianState] || GUARDIAN_STATUS.PATROL;
    this.guardianState.innerText = status.text;
    this.guardianState.className = status.cls;

    const dangerStart = 14;
    if (distToGuardian < dangerStart) {
      const intensity = Math.max(0, Math.min(1, 1 - (distToGuardian - 2) / (dangerStart - 2)));
      this.vignette.style.opacity = intensity.toFixed(2);
    } else {
      this.vignette.style.opacity = '0';
    }
  },

  setCameraMode(mode) {
    this.cam.innerText = mode === 1 ? 'Terceira Pessoa' : 'Primeira Pessoa';
  },

  setScore(collected, total) {
    this.score.innerText = `${collected} / ${total}`;
  },

  showVictory() {
    this.vignette.style.opacity = '0';
    this.victoryScreen.style.display = 'flex';
  },

  showGameOver() {
    this.vignette.style.opacity = '0.85';
    this.gameOverScreen.style.display = 'flex';
  }
};