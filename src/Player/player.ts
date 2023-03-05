import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import Character_animation from "./animation";
import Camera_movement from "../camera.js";
import Character_control from "./control";
import BasicCharacterControllerInput from "../Action/input";
import MouseControl from "../Action/mouseMove";
import { CharacterAnimationType } from "../type";

interface PropsType {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export default class Player {
  character_control: Character_control;
  character_animation: Character_animation;
  camera_movement: Camera_movement;
  characterMixer: THREE.AnimationMixer;
  character: THREE.Group;
  characterRotateBox: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.Material | THREE.Material[]
  >;
  mouse_control: MouseControl;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;

  constructor({ camera, scene }: PropsType) {
    this.scene = scene;
    this.camera = camera;
    this.initialize();
  }

  async initialize() {
    this.mouse_control = new MouseControl();

    const manager = new THREE.LoadingManager();

    // manager.onProgress = function (item, loaded, total) {
    //   console.log("Loaded:", Math.round((loaded / total) * 100) + "%");
    // };

    const fbxLoader = new FBXLoader(manager);

    // const glbLoader = new GLTFLoader();
    // const robot = await glbLoader.loadAsync(
    //   "/assets/raid_boss_shogun/scene.gltf"
    // );

    // robot.scene.scale.set(3, 3, 3);
    // robot.scene.position.add(new THREE.Vector3(0, 0, 40));

    // robot.scene.rotation.set(0, 3.5, 0);

    // robot.scene.traverse((item) => {
    //   item.receiveShadow = true;
    //   item.castShadow = true;
    // });

    // this.scene.add(robot.scene);

    const character = await fbxLoader.loadAsync("/assets/char.fbx");
    // console.log(
    //   "Loaded succesfully %ccharacter",
    //   "color: red; font-weight: bold"
    // );

    this.characterRotateBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

    this.character = character;

    character.scale.set(0.04, 0.04, 0.04);
    character.receiveShadow = true;
    character.castShadow = true;

    character.traverse((item) => {
      item.receiveShadow = true;
      item.castShadow = true;
    });

    this.characterMixer = new THREE.AnimationMixer(this.character);

    const characterAnimations: CharacterAnimationType = {
      running: undefined,
      runningBack: undefined,
      walking: undefined,
      idle: undefined,
      jump: undefined,
      leftRun: undefined,
      rightRun: undefined,
      getHit: undefined,
      hit: undefined,
      hitSecond: undefined,
      roll: undefined,
    };

    const onLoad = (name: string, animation: THREE.Group) => {
      // console.log(
      //   `Loaded succesfully %c${name}`,
      //   "color: red; font-weight: bold"
      // );

      if (name == "roll") {
        const newAnimation = this.characterMixer.clipAction(
          animation.animations[0]
        );

        characterAnimations[name as keyof typeof characterAnimations] =
          newAnimation;
      }

      // use for remove change character position behavior
      const animationClip = animation.animations[0];

      const rootBone = character.children[0];
      const tracks = animationClip.tracks;
      const rootTranslationTrackIndex = tracks.findIndex(
        (track) =>
          track.name.endsWith(".position") &&
          track.name.startsWith(rootBone.name)
      );
      if (rootTranslationTrackIndex !== -1) {
        tracks.splice(rootTranslationTrackIndex, 1);
      }

      const newAnimation = this.characterMixer.clipAction(
        animation.animations[0]
      );

      characterAnimations[name as keyof typeof characterAnimations] =
        newAnimation;
    };

    const urlsAnimationModels = [
      { url: "/assets/running.fbx", name: "running" },
      { url: "/assets/Running Backward.fbx", name: "runningBack" },
      { url: "/assets/walking.fbx", name: "walking" },
      { url: "/assets/idle.fbx", name: "idle" },
      { url: "/assets/jump.fbx", name: "jump" },
      { url: "/assets/left strafe.fbx", name: "leftRun" },
      { url: "/assets/right strafe.fbx", name: "rightRun" },
      { url: "/assets/Big Hit To Head.fbx", name: "getHit" },
      { url: "/assets/Punching.fbx", name: "hit" },
      { url: "/assets/Punching_s.fbx", name: "hitSecond" },
      { url: "/assets/Stand To Roll.fbx", name: "roll" },
    ];

    const animationsModels = await Promise.all(
      urlsAnimationModels.map((item) => fbxLoader.loadAsync(item.url))
    );

    animationsModels.forEach((item, index) => {
      onLoad(urlsAnimationModels[index].name, item);
    });

    this.scene.add(this.character);

    const input = new BasicCharacterControllerInput();

    this.camera_movement = new Camera_movement({
      character: this.character,
      camera: this.camera,
      mouse: this.mouse_control,
      characterRotateBox: this.characterRotateBox,
    });

    this.character_animation = new Character_animation({
      animations: characterAnimations,
      input,
    });

    this.character_control = new Character_control({
      character: this.character,
      input,
      mouse: this.mouse_control,
      animation: this.character_animation,
      characterRotateBox: this.characterRotateBox,
    });
  }

  update(deltaT: number, customProps?: any) {
    if (this.character) {
      this.characterRotateBox.position.copy(this.character.position);
    }

    if (!this.mouse_control.paused) {
      this.character_control?.update(deltaT);
      this.character_animation?.update(deltaT);
    }

    this.characterMixer?.update(deltaT);

    this.camera_movement?.update(deltaT);
  }
}
