import { CharacterAnimationType } from "./type";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import "toastr/build/toastr.min.css";
import Camera_movement from "./camera.js";
import { ASPECT, FAR, FOV, NEAR } from "./configs/constants";
import Character_control from "./control";
import Light from "./light";
import BasicCharacterControllerInput from "./input";
import Character_animation from "./animation";
import { GUI } from "dat.gui";
import { Vector2 } from "three";
import MouseControl from "./mouseMove";
class Game {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  control: OrbitControls;
  stats: Stats;
  character_control: Character_control;
  camera_movement: Camera_movement;
  lastTime: number;
  clock: THREE.Clock;
  character: THREE.Object3D;
  characterBB: THREE.Box3;
  wallsBB: THREE.Box3[] = [];
  characterMixer: THREE.AnimationMixer;
  character_animation: Character_animation;
  mouse_control: MouseControl;

  constructor() {
    this.initialize();
  }

  initialize() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.3;

    document.body.appendChild(this.renderer.domElement);
    window.addEventListener(
      "resize",
      () => {
        this.onWindowResize();
      },
      false
    );

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#DEF5E5");
    this.scene.add(new THREE.AxesHelper(200));

    this.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);

    this.control = new OrbitControls(this.camera, this.renderer.domElement);

    this.control.dispose();

    new Light(this.scene);

    const groundTexure = new THREE.TextureLoader().load(
      "/assets/ground/pavement_03_diff_1k.jpg"
    );
    groundTexure.repeat.set(10, 10);
    groundTexure.wrapS = THREE.RepeatWrapping;
    groundTexure.wrapT = THREE.RepeatWrapping;

    const groundTexureNor = new THREE.TextureLoader().load(
      "/assets/ground/pavement_03_nor_gl_1k.jpg"
    );
    groundTexureNor.repeat.set(10, 10);
    groundTexureNor.wrapS = THREE.RepeatWrapping;
    groundTexureNor.wrapT = THREE.RepeatWrapping;

    const groundTexureARM = new THREE.TextureLoader().load(
      "/assets/ground/pavement_03_arm_1k.jpg"
    );
    groundTexureARM.repeat.set(10, 10);
    groundTexureARM.wrapS = THREE.RepeatWrapping;
    groundTexureARM.wrapT = THREE.RepeatWrapping;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({
        map: groundTexure,
        normalMap: groundTexureNor,
        aoMap: groundTexureARM,
        roughnessMap: groundTexureARM,
        metalnessMap: groundTexureARM,
        normalScale: new Vector2(50, 50),
      })
    );
    plane.rotation.set(-Math.PI / 2, 0, 0);
    plane.position.set(0, 0, 0);
    plane.receiveShadow = true;
    this.scene.add(plane);

    const wallsArray = [
      {
        position: [0, 3, -20],
        size: [40, 10, 2],
        rotation: [0, 0, 0],
      },
      {
        position: [-20, 3, 0],
        size: [30, 10, 2],
        rotation: [0, 0, 0],
      },
      {
        position: [-40, 3, -20],
        size: [2, 20, 40],
        rotation: [0, 0, 0],
      },
      {
        position: [40, 3, -20],
        size: [2, 10, 40],
        rotation: [0, 0, 0],
      },
      {
        position: [30, 3, 20],
        size: [2, 10, 40],
        rotation: [0, 0, 0],
      },
      {
        position: [10, 3, 20],
        size: [2, 40, 10],
        rotation: [0, 0, 0],
      },
    ];

    wallsArray.forEach(({ position, size, rotation }) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], size[2]),
        new THREE.MeshStandardMaterial({
          color: 0xfffbc1,
        })
      );

      wall.castShadow = true;
      wall.receiveShadow = true;

      wall.rotation.set(rotation[0], rotation[1], rotation[2]);
      wall.position.set(position[0], position[1], position[2]);

      this.scene.add(wall);

      const wallBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
      wallBB.setFromObject(wall);

      this.wallsBB.push(wallBB);
    });

    this.mouse_control = new MouseControl();

    this.stats = Stats();
    // fps show
    document.body.appendChild(this.stats.dom);

    this.loadModels();

    this.clock = new THREE.Clock();
    this.gameloop(0);
  }

  async loadModels() {
    const manager = new THREE.LoadingManager();

    manager.onProgress = function (item, loaded, total) {
      console.log("Loaded:", Math.round((loaded / total) * 100) + "%");
    };

    const fbxLoader = new FBXLoader(manager);

    const character = await fbxLoader.loadAsync("/assets/char.fbx");
    console.log(
      "Loaded succesfully %ccharacter",
      "color: red; font-weight: bold"
    );

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
    };

    const onLoad = (name: string, animation: THREE.Group) => {
      console.log(
        `Loaded succesfully %c${name}`,
        "color: red; font-weight: bold"
      );

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
    });

    this.character_control = new Character_control({
      character: this.character,
      control: this.control,
      camera: this.camera,
      scene: this.scene,
      input,
      mouse: this.mouse_control,
    });

    this.character_animation = new Character_animation({
      animations: characterAnimations,
      input,
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  gameloop(t: number) {
    requestAnimationFrame((t) => {
      this.gameloop(t);
    });

    const deltaT = this.clock.getDelta();

    if (!this.mouse_control.paused) {
      this.character_control?.update(deltaT);
      this.character_animation?.update(deltaT);
    }

    this.characterMixer?.update(deltaT);
    this.renderer.render(this.scene, this.camera);

    this.stats.update();
    this.camera_movement?.update(deltaT);
  }
}

new Game();
