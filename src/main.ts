import * as THREE from "three";
import { Vector2 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import Character from "./Character/character";
import { ASPECT, FAR, FOV, NEAR } from "./configs/constants";
import Light from "./light";
import Player from "./Player/player";
import {
  CoordinateType,
  PointsFormatType,
  PointsType,
  VerticesType,
} from "./type";
import { findNearestPosition, getKeyPoint } from "./utils";
import { findPath } from "./utils/pathfind";

class Game {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  control: OrbitControls;
  stats: Stats;
  clock: THREE.Clock;

  // chua tat ca cac player / NPC trong mot mang
  entitiesCharacter: (Player | Character)[] = [];

  constructor() {
    this.initialize();
  }

  initialize() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
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

    this.loadGround();

    this.stats = Stats();
    // fps show
    // document.body.appendChild(this.stats.dom);

    this.entitiesCharacter.push(
      new Player({
        camera: this.camera,
        scene: this.scene,
      })
    );

    // this.entitiesCharacter.push(
    //   new Character({
    //     scene: this.scene,
    //   })
    // );

    this.clock = new THREE.Clock();
    this.gameloop(0);
  }

  loadGround() {
    const textureGroundAssets = [
      "/assets/ground/pavement_03_diff_1k.jpg",
      "/assets/ground/pavement_03_nor_gl_1k.jpg",
      "/assets/ground/pavement_03_arm_1k.jpg",
    ];

    const [groundTexure, groundTexureNor, groundTexureARM] =
      textureGroundAssets.map((itemUrl) => {
        const textureReturn = new THREE.TextureLoader().load(itemUrl);
        textureReturn.repeat.set(1, 1);
        textureReturn.wrapS = THREE.RepeatWrapping;
        textureReturn.wrapT = THREE.RepeatWrapping;

        return textureReturn;
      });

    const disMap = new THREE.TextureLoader().load(
      "/043-ue4-heightmap-guide-02.jpg"
    );

    disMap.wrapS = disMap.wrapT = THREE.RepeatWrapping;

    disMap.repeat.set(1, 1);

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120, 1000, 1000),
      new THREE.MeshStandardMaterial({
        map: groundTexure,
        normalMap: groundTexureNor,
        aoMap: groundTexureARM,
        roughnessMap: groundTexureARM,
        metalnessMap: groundTexureARM,
        normalScale: new Vector2(50, 50),
        // displacementMap: disMap,
        // displacementScale: 10,
      })
    );
    plane.name = "ground_test";
    plane.rotation.set(-Math.PI / 2, 0, 0);
    plane.position.set(0, 0, 0);
    plane.receiveShadow = true;
    this.scene.add(plane);
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

    this.entitiesCharacter.forEach((item, index, array) => {
      item.update(deltaT, {
        entities: array,
      });
    });

    this.renderer.render(this.scene, this.camera);

    this.stats.update();
  }
}

new Game();
