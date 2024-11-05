class Button {
    constructor(color, isPressed = false) {
      this.color = color;
      this.isPressed = isPressed;
    }
  
    setColor(newColor) {
      this.color = newColor;
    }
  
    press() {
      this.isPressed = true;
    }
  
    release() {
      this.isPressed = false;
    }
  }
  
  export default Button;
  