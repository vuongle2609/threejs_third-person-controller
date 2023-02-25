export interface CharacterAnimationType {
  running: THREE.AnimationAction | undefined;
  runningBack: THREE.AnimationAction | undefined;
  walking: THREE.AnimationAction | undefined;
  idle: THREE.AnimationAction | undefined;
  jump: THREE.AnimationAction | undefined;
  leftRun: THREE.AnimationAction | undefined;
  rightRun: THREE.AnimationAction | undefined;
  hit: THREE.AnimationAction | undefined;
  getHit: THREE.AnimationAction | undefined;
}

export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  shift: boolean;
  leftClick: boolean;
  rightClick: boolean;
}
