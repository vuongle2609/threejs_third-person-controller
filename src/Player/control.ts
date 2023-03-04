import * as THREE from "three";
import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Character_animation from "./animation";
import { SPEED } from "../configs/constants";
import BasicCharacterControllerInput from "../Action/input";
import MouseControl from "../Action/mouseMove";

interface PropsType {
  character: THREE.Object3D;
  characterRotateBox: THREE.Object3D;
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
  isRoll: boolean;
  mouse_control: MouseControl;
  animation: Character_animation;
  characterRotateBox: THREE.Object3D<THREE.Event>;
  characterRotateAngle = {
    allowSet: true,
    angle: 1,
  };

  constructor({
    character,
    input,
    mouse,
    animation,
    characterRotateBox,
  }: PropsType) {
    this.input = input;
    this.character = character;
    this.characterRotateBox = characterRotateBox;
    this.mouse_control = mouse;
    this.animation = animation;

    this.currentPosition = new Vector3();
  }

  updateNewPosition(deltaT: number) {
    // vector chi huong di chuyen
    const direction = new Vector3().copy(this.currentPosition);

    const frontVector = new Vector3(
      0,
      0,
      (this.input.keys.forward || this.isRoll ? 1 : 0) -
        (this.input.keys.backward && !this.isRoll ? 1 : 0)
    );

    const sideVector = new Vector3(
      (this.input.keys.left && !this.isRoll ? 1 : 0) -
        (this.input.keys.right && !this.isRoll ? 1 : 0),
      0,
      0
    );

    direction.subVectors(frontVector, sideVector);

    this.currentPosition.copy(this.character.position);

    // vector di chuyen theo huong camera
    const forwardVector = new Vector3();
    this.characterRotateBox.getWorldDirection(forwardVector);

    forwardVector.y = 0;
    forwardVector.normalize();

    const vectorUp = new Vector3(0, 1, 0);

    const vectorRight = vectorUp.clone().crossVectors(vectorUp, forwardVector);

    const moveVector = new Vector3().addVectors(
      forwardVector.clone().multiplyScalar(frontVector.z),
      vectorRight.multiplyScalar(sideVector.x)
    );

    moveVector.normalize().multiplyScalar(SPEED * deltaT);

    // rotate character voi cac huong cua phim
    this.characterRotateBox.rotation.set(
      0,
      6.2832 * -this.mouse_control.mousePercentScreenX,
      0
    );

    const isMove = !!moveVector.x || !!moveVector.z;
    const characterForwardVector = new Vector3();
    this.character.getWorldDirection(characterForwardVector);

    // chi rotate nhan vat khi dang chay hoac dung yen
    if (
      moveVector.angleTo(characterForwardVector) > 0.1 &&
      isMove &&
      (this.animation.fsm.state == "idle" ||
        this.animation.fsm.state == "running")
    ) {
      // quyet dinh xem nhan vat nen xoay theo huong trai hay phai tuy theo
      // do lon va huong giua hai vector, bang cach thay doi angle thanh so am hoac duong
      if (this.characterRotateAngle.allowSet) {
        this.characterRotateAngle.allowSet = false;
        const axis = new Vector3();
        axis.crossVectors(moveVector, characterForwardVector).normalize();

        this.characterRotateAngle.angle = axis.y < 0 ? 1 : -1;
      }

      const angle = 0.19 * this.characterRotateAngle.angle;
      const quaternion = new THREE.Quaternion().setFromAxisAngle(
        vectorUp,
        angle
      );
      this.character.quaternion.multiplyQuaternions(
        this.character.quaternion,
        quaternion
      );
    } else {
      this.characterRotateAngle.allowSet = true;
    }

    // xu ly chan di chuyen khi dang roll
    if (this.animation.fsm.state != "roll") {
      this.isRoll = false;
    }

    if (this.animation.fsm.state == "roll" && !this.isRoll) {
      this.isRoll = true;
    }

    if (this.isRoll) {
      const newCharacterRollMove = characterForwardVector
        .normalize()
        .multiplyScalar(SPEED * deltaT);
      this.character.position.add(
        new Vector3(newCharacterRollMove.x, 0, newCharacterRollMove.z)
      );
    }

    if (!this.animation.preventAction)
      this.character.position.add(new Vector3(moveVector.x, 0, moveVector.z));
  }

  update(deltaT: number) {
    if (deltaT > 0.15) {
      deltaT = 0.15;
    }

    this.updateNewPosition(deltaT);
  }
}
