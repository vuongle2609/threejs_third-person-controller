import { CoordinateType } from "./../type";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import Character_animation from "../Player/animation";
import Camera_movement from "../camera.js";
import Character_control from "../Player/control";
import BasicCharacterControllerInput from "../Action/input";
import MouseControl from "../Action/mouseMove";
import { CharacterAnimationType } from "../type";
import Player from "../Player/player";
import { findNearestPosition, getKeyPoint, isEqualPosition } from "../utils";
import verticesFormat from "../configs/navMesh";
import { findPath } from "../utils/pathfind";
import { Vector3 } from "three";
import { SPEED } from "../configs/constants";

interface PropsType {
  scene: THREE.Scene;
}

export default class Character {
  scene: THREE.Scene;
  character: THREE.Group;
  characterMixer: THREE.AnimationMixer;
  prevMovePointCharacter: CoordinateType;
  prevMovePointPlayer: CoordinateType;

  currentMoveTo: CoordinateType | null = null;
  arrayMove: CoordinateType[] = [];

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

    const path = [
      new THREE.Vector3(-5, 0, 0),
      new THREE.Vector3(0, 0, 5),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(-5, 0, 0),
    ];
    
    // Calculate the total length of the path
    let totalLength = 0;
    for (let i = 1; i < path.length; i++) {
      totalLength += path[i].distanceTo(path[i - 1]);
    }
    
    // Define the speed
    const speed = 5; // units per second
    
    // Calculate the time required to complete the path
    const time = totalLength / speed;
    
    // Set up a timer to move the object along the path
    let elapsedTime = 0;
    const timer = setInterval(() => {
      // Calculate the position of the object along the path
      const distance = speed * elapsedTime;
      let currentLength = 0;
      let index = 0;
      while (index < path.length - 1 && currentLength + path[index + 1].distanceTo(path[index]) < distance) {
        currentLength += path[index + 1].distanceTo(path[index]);
        index++;
      }
      const start = path[index];
      const end = path[index + 1];
      const ratio = (distance - currentLength) / end.distanceTo(start);
      const position = start.clone().lerp(end, ratio);
    
      // Update the position of the object
      this.character.position.copy(position);
    
      // Update the elapsed time
      elapsedTime += 0.01; // 10 milliseconds
    
      // Stop the timer if the object has reached the end of the path
      if (elapsedTime >= time) {
        clearInterval(timer);
      }
    }, 10); // 10 milliseconds

    // this.character_animation = new Character_animation({
    //   animations: characterAnimations,
    //   input,
    // });
  }

  moveCharacter(deltaT: number) {
    //lmao wtf =))
    if (this.currentMoveTo) return;

    this.currentMoveTo = this.arrayMove.pop() || null;

    if (!this.currentMoveTo) return;

    const moveToVector = new Vector3(
      this.currentMoveTo[0],
      this.character.position.y,
      this.currentMoveTo[1]
    );

    const RAF_move = () => {
      if (this.character.position.distanceTo(moveToVector) <= 0.1) {
        this.currentMoveTo = null;
        return;
      }

      requestAnimationFrame((t) => {
        RAF_move();
      });

      this.character.position.lerp(moveToVector, 0.054);

      // this.character.position.add(
      //   moveToVector.normalize().multiplyScalar(SPEED * deltaT)
      // );
    };

    RAF_move();
  }

  chasePlayer(player: Player) {
    try {
      const { x, z } = player.character.position;
      const nearestPlayer = findNearestPosition(verticesFormat, [x, z]);
      const nearestMob = findNearestPosition(verticesFormat, [
        this.character.position.x,
        this.character.position.z,
      ]);

      this.character.lookAt(player.character.position);

      if (
        !(
          isEqualPosition(nearestPlayer, this.prevMovePointPlayer) &&
          isEqualPosition(nearestPlayer, this.prevMovePointPlayer)
        )
      ) {
        this.prevMovePointCharacter = nearestMob;
        this.prevMovePointPlayer = nearestPlayer;

        this.arrayMove =
          findPath({
            start: verticesFormat[getKeyPoint(nearestMob)],
            target: verticesFormat[getKeyPoint(nearestPlayer)],
          }) || [];
      }
    } catch (err) {
      console.log(err);
    }
  }

  update(deltaT: number, customProps?: any) {
    const { entities } = customProps;

    // this.chasePlayer(entities[0]);
    // this.moveCharacter(deltaT);

    this.characterMixer?.update(deltaT);
  }
}
