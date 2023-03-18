import { GUI } from "dat.gui";
import * as THREE from "three";
import { Quaternion, Vector2, Vector3 } from "three";
import MouseControl from "./Action/mouseMove";

interface PropsType {
  character: THREE.Object3D;
  characterRotateBox: THREE.Object3D;
  camera: THREE.PerspectiveCamera;
  mouse: MouseControl;
}

const pow = Math.pow;

export default class Camera_movement {
  camera: THREE.PerspectiveCamera;
  character: THREE.Object3D;
  currentPosition: THREE.Vector3;
  currentLookat: THREE.Vector3;
  mouse_control: MouseControl;
  characterRotateBox: THREE.Object3D<THREE.Event>;

  constructor({ character, camera, mouse, characterRotateBox }: PropsType) {
    this.character = character;
    this.characterRotateBox = characterRotateBox;
    this.camera = camera;
    this.mouse_control = mouse;

    this.currentPosition = new THREE.Vector3();
    this.currentLookat = new THREE.Vector3();
  }

  private get NewCameraY() {
    const maxY = 44;
    const minY = -20;
    const originY = minY - maxY;
    const newY = originY * this.mouse_control.mousePercentScreenY;

    return minY - newY;
  }

  private get NewCameraZ() {
    const maxZ = -1;
    const minZ = -36 * 2;
    const originZ = minZ - maxZ;
    const MPY = this.mouse_control.mousePercentScreenY;
    const newPercentMouse = MPY > 0.5 ? 0.5 + (0.5 - MPY) : MPY;
    const newZ = originZ * newPercentMouse;

    return newZ;
  }

  private calculateIdealOffset() {
    const idealOffset = new THREE.Vector3(0, this.NewCameraY, this.NewCameraZ);
    idealOffset.applyQuaternion(
      new Quaternion().setFromEuler(this.characterRotateBox.rotation.clone())
    );
    idealOffset.add(this.character.position.clone());
    return idealOffset;
  }

  private calculateIdealLookat() {
    const { x, y, z } = this.character.position;
    const idealLookat = new Vector3(x, 3.4, z);

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
    // this.currentLookat.lerp(idealLookat, t);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(idealLookat);
  }

  update(deltaT: number) {
    this.updateNewPosition(deltaT);
  }
}
