import { GUI } from "dat.gui";
import * as THREE from "three";
import { Quaternion } from "three";
import MouseControl from "./mouseMove";

interface PropsType {
  character: THREE.Object3D;
  camera: THREE.PerspectiveCamera;
  mouse: MouseControl;
}

export default class Camera_movement {
  camera: THREE.PerspectiveCamera;
  character: THREE.Object3D;
  currentPosition: THREE.Vector3;
  currentLookat: THREE.Vector3;
  mouse_control: MouseControl;
  test = 16;

  constructor({ character, camera, mouse }: PropsType) {
    this.character = character;
    this.camera = camera;
    this.mouse_control = mouse;

    this.currentPosition = new THREE.Vector3();
    this.currentLookat = new THREE.Vector3();
  }

  private calculateIdealOffset() {
    const maxY = 30;
    const minY = 8;
    const originY = maxY - minY;
    const newY = originY * this.mouse_control.mousePercentScreenY;

    const idealOffset = new THREE.Vector3(0, maxY - newY, -30);
    idealOffset.applyQuaternion(
      new Quaternion().setFromEuler(this.character.rotation.clone())
    );
    idealOffset.add(this.character.position.clone());
    return idealOffset;
  }

  private calculateIdealLookat() {
    const maxY = 34;
    const minY = 10;
    const originY = maxY - minY;
    const newY = originY * this.mouse_control.mousePercentScreenY;

    const idealLookat = new THREE.Vector3(0, 0, minY + newY);
    idealLookat.applyQuaternion(
      new Quaternion().setFromEuler(this.character.rotation.clone())
    );
    idealLookat.add(this.character.position.clone());
    return idealLookat;
  }

  private updateNewPosition(deltaT: number) {
    const idealOffset = this.calculateIdealOffset();
    const idealLookat = this.calculateIdealLookat();

    // const t = 0.05;
    // const t = 4.0 * deltaT;
    const t = 1.2 - Math.pow(0.001, deltaT);

    const t1 = 1;

    this.currentPosition.lerp(idealOffset, t);
    this.currentLookat.lerp(idealLookat, t);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookat);
  }

  update(deltaT: number) {
    this.updateNewPosition(deltaT);
  }
}