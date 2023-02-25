export default class MouseControl {
  public mousePercentScreenX = 0;
  public mousePercentScreenY = 0;
  public paused = true;
  public x = 0;
  public y = 0;

  constructor() {
    this.initialControl();
  }

  private initialControl() {
    const modal_start = document.querySelector(".modal_start");
    const buttonStart = document.querySelector(".modal_start button");
    const canvas = document.querySelector("canvas");

    buttonStart?.addEventListener("click", () => {
      canvas?.requestPointerLock();
    });

    const handleLockChange = () => {
      if (document.pointerLockElement === canvas) {
        this.paused = false;
        if (modal_start) {
          //@ts-ignore
          modal_start.style.display = "none";
        }
        document.addEventListener("mousemove", updatePosition, false);
      } else {
        this.paused = true;
        if (modal_start) {
          //@ts-ignore
          modal_start.style.display = "flex";
        }
        document.removeEventListener("mousemove", updatePosition, false);
      }
    };

    const updatePosition = (e: any) => {
      const canvasWidth = canvas?.width || 0;
      const canvasHeight = canvas?.height || 0;
      this.x += e.movementX;
      this.y += e.movementY;

      if (this.x > canvasWidth) {
        this.x = 0;
      } else if (this.x < 0) {
        this.x = canvasWidth;
      }

      if (this.y > canvasHeight) {
        this.y = canvasHeight;
      } else if (this.y < 0) {
        this.y = 0;
      }

      this.mousePercentScreenX = this.x / canvasWidth;
      this.mousePercentScreenY = this.y / canvasHeight;
    };

    document.addEventListener("pointerlockchange", handleLockChange, false);
  }
}
