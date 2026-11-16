export const Input = {
  keys: {},
  mouseDeltaX: 0,

  init() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    
    window.addEventListener('blur', () => {
      this.keys = {};
    });

    // Captura o movimento do mouse para girar o boneco na 1ª pessoa
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this.mouseDeltaX += e.movementX || 0;
      }
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