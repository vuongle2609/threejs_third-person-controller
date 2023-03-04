import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import Character_animation from "./animation";
import Camera_movement from "./camera.js";
import Character_control from "./control";
import BasicCharacterControllerInput from "./input";
import MouseControl from "./mouseMove";
import { CharacterAnimationType } from "./type";

interface PropsType {
  scene: THREE.Scene;
}

export default class Character {
  scene: THREE.Scene;
  character: THREE.Group;
  characterMixer: THREE.AnimationMixer;
  constructor({ scene }: PropsType) {
    this.scene = scene;

    this.initialize();
  }

  async initialize() {
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
    
    // this.character_animation = new Character_animation({
    //   animations: characterAnimations,
    //   input,
    // });
  }

  update(deltaT: number) {
    this.characterMixer?.update(deltaT);
  }
}
