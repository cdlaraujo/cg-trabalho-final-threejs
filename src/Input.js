export const Input = {
  keys: {},
  mouseDeltaX: 0,
  isDragging: false,

  init() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.isDragging = true;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement || this.isDragging) {
        this.mouseDeltaX += e.movementX || 0;
      }
    });
  },

  isPressed(key) {
    return !!this.keys[key];
  },

  consumeMouseX() {
    const dx = this.mouseDeltaX;
    this.mouseDeltaX = 0;
    return dx;
  }
};