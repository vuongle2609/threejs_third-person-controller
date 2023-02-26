import * as THREE from "three";
import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Character_animation from "./animation";
import { GRAVITY, JUMP_FORCE, SPEED } from "./configs/constants";
import BasicCharacterControllerInput from "./input";
import MouseControl from "./mouseMove";

interface PropsType {
  character: THREE.Object3D;
  input: BasicCharacterControllerInput;
  mouse: MouseControl;
  animation: Character_animation;
}

export default class Character_control {
  input: BasicCharacterControllerInput;
  character: THREE.Object3D;
  control: OrbitControls;
  currentPosition: Vector3;
  camera: THREE.PerspectiveCamera;
  isJump: boolean;
  velocityY: number = 0;
  airDirection: Vector3 | null;
  scene: THREE.Scene;
  mouse_control: MouseControl;
  animation: Character_animation;

  constructor({ character, input, mouse, animation }: PropsType) {
    this.input = input;
    this.character = character;
    this.mouse_control = mouse;
    this.animation = animation;

    this.currentPosition = new Vector3();
  }

  updateNewPosition(deltaT: number) {
    this.character.rotation.set(
      0,
      6.2832 * -this.mouse_control.mousePercentScreenX,
      0
    );

    // vector chi huong di chuyen
    const direction = new Vector3().copy(this.currentPosition);

    const frontVector = new Vector3(
      0,
      0,
      (this.input.keys.forward ? 1 : 0) - (this.input.keys.backward ? 1 : 0)
    );

    const sideVector = new Vector3(
      (this.input.keys.left ? 1 : 0) - (this.input.keys.right ? 1 : 0),
      0,
      0
    );

    direction.subVectors(frontVector, sideVector);

    this.currentPosition.copy(this.character.position);

    let gravityVector = new Vector3(0, 0, 0);

    let moveVector = new Vector3(direction.x, 0, direction.z);

    const forwardVector = new Vector3();
    this.character.getWorldDirection(forwardVector);

    forwardVector.y = 0;
    forwardVector.normalize();

    const vectorUp = new Vector3(0, 1, 0);

    const vectorRight = vectorUp.crossVectors(vectorUp, forwardVector);

    const moveVector2 = new Vector3().addVectors(
      forwardVector.multiplyScalar(frontVector.z),
      vectorRight.multiplyScalar(sideVector.x)
    );

    // if (this.character.touching && this.character.direction) {
    //   const wallVector = this.character.direction.normalize();

    //   const moveVectorCopy = new Vector3()
    //     .copy(
    //       new Vector3(
    //         this.airDirection?.x && !moveVector.x
    //           ? this.airDirection.x
    //           : moveVector.x,
    //         0,
    //         this.airDirection?.z && !moveVector.z
    //           ? this.airDirection.z
    //           : moveVector.z
    //       )
    //     )
    //     .normalize();

    //   if (wallVector.angleTo(moveVectorCopy) > 1) {
    //     const dotWallPlayer = new Vector3()
    //       .copy(moveVectorCopy)
    //       .dot(wallVector);

    //     const wallVectorScalar = new Vector3(
    //       wallVector.x * dotWallPlayer,
    //       wallVector.y * dotWallPlayer,
    //       wallVector.z * dotWallPlayer
    //     );

    //     const newMoveVector = new Vector3().subVectors(
    //       moveVectorCopy,
    //       wallVectorScalar
    //     );

    //     moveVector = new Vector3(newMoveVector.x, 0, newMoveVector.z);
    //   }
    // }

    moveVector2.normalize().multiplyScalar(SPEED);

    // if (this.isJump) {
    //   this.velocityY -= GRAVITY * deltaT;

    //   if (
    //     !this.airDirection ||
    //     // this.character.touching ||
    //     this.input.keys.backward ||
    //     this.input.keys.forward ||
    //     this.input.keys.left ||
    //     this.input.keys.right
    //   ) {
    //     this.airDirection = moveVector;
    //   }

    //   if (this.character.position.y <= 0) {
    //     this.airDirection = null;
    //     this.velocityY = 0;
    //     gravityVector.y = 0;
    //     this.isJump = false;
    //   }
    // }

    if (this.input.keys.space && !this.isJump) {
      this.velocityY = JUMP_FORCE;
      this.isJump = true;
    }

    if (this.character.position.y >= 0 && !this.isJump) {
      this.isJump = true;
    }

    gravityVector.y += this.velocityY * deltaT;

    if (this.airDirection) {
      gravityVector.add(
        new Vector3(
          moveVector.x ? 0 : this.airDirection.x,
          this.airDirection.y,
          moveVector.z ? 0 : this.airDirection.z
        )
      );
    }
    
    if (!this.animation.preventAction)
      this.character.position
        .add(new Vector3(moveVector2.x, 0, moveVector2.z))
        .add(gravityVector);
  }

  update(deltaT: number) {
    if (deltaT > 0.15) {
      deltaT = 0.15;
    }

    this.updateNewPosition(deltaT);
  }
}
