import * as THREE from "three";
import { BufferGeometry, Object3D, Vector3 } from "three";
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
  deltaTPreventRaycast = 0;

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
    this.raycaster.far = 1;
    this.raycaster.firstHitOnly = true;

    this.plane = this.scene.getObjectByName("ground_test");

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

      newCharacterRollMove.y = 0;
      this.character.position.add(newCharacterRollMove);
    }

    if (!this.animation.preventAction) {
      moveVector.y = 0;
      this.character.position.add(moveVector);
    }

    this.raycaster.set(this.character.position, new Vector3(0, -1, 0));

    this.deltaTPreventRaycast += deltaT;

    // handle touch ground gravity
    let groundVector;
    if (true) {
      const intersects = this.raycaster.intersectObject(
        this.plane as Object3D,
        false
      );
      groundVector = intersects[0]?.face?.normal;

      this.deltaTPreventRaycast = 0;
    }

    let gravityVector = new Vector3(0, -1, 0);

    if (groundVector) {
      gravityVector.sub(
        groundVector.multiplyScalar(
          gravityVector.clone().dot(groundVector.clone())
        )
      );
    }
    console.log("cal", gravityVector.multiplyScalar(30 * deltaT).y);

    // console.log(gravityVector.multiplyScalar(10 * deltaT).round());
    this.character.position.add(gravityVector.multiplyScalar(30 * deltaT));
  }

  update(deltaT: number) {
    this.updateNewPosition(deltaT);
  }
}
