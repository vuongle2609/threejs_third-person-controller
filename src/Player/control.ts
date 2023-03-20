import * as THREE from "three";
import { BufferGeometry, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Character_animation from "./animation";
import { SPEED } from "../configs/constants";
import BasicCharacterControllerInput from "../Action/input";
import MouseControl from "../Action/mouseMove";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
THREE.Mesh.prototype.raycast = acceleratedRaycast;

interface PropsType {
  scene: THREE.Scene;
  character: THREE.Object3D;
  characterRotateBox: THREE.Object3D;
  input: BasicCharacterControllerInput;
  mouse: MouseControl;
  animation: Character_animation;
}

// code như con cặc
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
  raycaster: THREE.Raycaster;
  scene: THREE.Scene;
  plane: THREE.Object3D<THREE.Event> | undefined;
  bvh: MeshBVH;

  constructor({
    scene,
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
    this.scene = scene;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 10;
    this.raycaster.firstHitOnly = true;

    this.plane = this.scene.getObjectByName("ground_test");
    console.log(this.character.children[0]);

    this.currentPosition = new Vector3();
  }

  updateNewPosition(deltaT: number) {
    // vector chi huong di chuyen
    const direction = new Vector3().copy(this.currentPosition);
    const { forward, backward, left, right } = this.input.keys;

    const frontVector = new Vector3(
      0,
      0,
      ((forward && !backward) || this.isRoll ? 1 : 0) -
        (backward && !this.isRoll ? 1 : 0)
    );

    const sideVector = new Vector3(
      (left && !right && !this.isRoll ? 1 : 0) -
        (right && !this.isRoll ? 1 : 0),
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

    // giá trị một vòng của euler
    const FULL_EULER = 6.2832;

    // rotate character voi cac huong cua phim
    this.characterRotateBox.rotation.set(
      0,
      FULL_EULER * -this.mouse_control.mousePercentScreenX,
      0
    );

    const isMove = !!moveVector.x || !!moveVector.z;
    const characterForwardVector = new Vector3();
    this.character.getWorldDirection(characterForwardVector);

    // sai số khi rotate của nhân vật
    const ERROR_ROTATE = 0.1;

    // chi rotate nhan vat khi dang chay hoac dung yen
    if (
      moveVector.angleTo(characterForwardVector) > ERROR_ROTATE &&
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

      // constant cang lon thi rotate cang nhanh nhung
      // lam do chinh xac khi rotate giam, lam cho nhan
      // vat rotate nhieu vong
      const ROTATE_CONSTANT = 0.19;

      const angle = ROTATE_CONSTANT * this.characterRotateAngle.angle;
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

    this.raycaster.set(this.character.position, new Vector3(0, -1, 0));

    const gravityVector = new Vector3(0, -9.8, 0);

    this.character.position.add(gravityVector.multiplyScalar(deltaT));

    if (this.plane) {
      const a = this.raycaster.intersectObject(this.plane);
      // console.log(a);
    }
  }

  update(deltaT: number) {
    this.updateNewPosition(deltaT);
  }
}
