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
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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
    this.renderer.toneMappingExposure = 2;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;

    document.body.appendChild(this.renderer.domElement);
    window.addEventListener(
      "resize",
      () => {
        this.onWindowResize();
      },
      false
    );

    const skyboxTexture = new THREE.CubeTextureLoader().load([
      "/assets/sky/px.png",
      "/assets/sky/nx.png",
      "/assets/sky/py.png",
      "/assets/sky/ny.png",
      "/assets/sky/pz.png",
      "/assets/sky/nz.png",
    ]);

    this.scene = new THREE.Scene();
    this.scene.background = skyboxTexture;

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

    const glbLoader = new GLTFLoader();
    const robot = await glbLoader.loadAsync(
      "/assets/raid_boss_shogun/scene.gltf"
    );

    robot.scene.scale.set(3, 3, 3);
    robot.scene.position.add(new THREE.Vector3(0, 0, 40));

    robot.scene.rotation.set(0, 3.5, 0);

    robot.scene.traverse((item) => {
      item.receiveShadow = true;
      item.castShadow = true;
    });

    this.scene.add(robot.scene);

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
