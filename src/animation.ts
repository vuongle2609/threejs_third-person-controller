import StateMachine from "javascript-state-machine";
import StateMachineHistory from "javascript-state-machine/lib/history";
import * as THREE from "three";
import { AnimationAction } from "three";
import BasicCharacterControllerInput from "./input";
import { CharacterAnimationType } from "./type";

interface PropsType {
  animations: CharacterAnimationType;
  input: BasicCharacterControllerInput;
}

const MAX_FSM_HISTORY = 2;

export default class Character_animation {
  animations: CharacterAnimationType;
  input: BasicCharacterControllerInput;
  preventAction = false;
  fsm: any;
  attackStack = 0;

  constructor({ animations, input }: PropsType) {
    this.input = input;
    this.animations = animations;

    // @ts-ignore
    this.fsm = new StateMachine({
      init: "idle",
      transitions: [
        { name: "punch", from: "*", to: "hit" },
        { name: "punchSecond", from: "*", to: "hitSecond" },
        { name: "roll", from: "*", to: "roll" },
        { name: "trans", from: "*", to: (s: string) => s },
      ],
      methods: {
        onPunch: () => this.handlePunch("hit"),
        onPunchSecond: () => this.handlePunch("hitSecond"),
        onTrans: () => this.handleTrans(),
        onRoll: () => this.handleRoll(),
      },
      // @ts-ignore
      plugins: [new StateMachineHistory({ max: MAX_FSM_HISTORY })],
    });

    this.fsm.trans("idle");

    document.addEventListener(
      "pointerlockchange",
      () => this.handleLockChange(),
      false
    );
  }

  handleLockChange() {
    const canvas = document.querySelector("canvas");
    if (document.pointerLockElement !== canvas) {
      // this.fsm.trans("idle");
    }
  }

  handleAnimation() {
    const { keys } = this.input;

    if (this.preventAction) return;
    if (keys.leftClick || this.attackStack > 0) {
      this.handleLeftClick();
    } else if (keys.space) {
      this.fsm.trans("roll");
    } else if (keys.left) {
      // this.fsm.trans("leftRun");
      this.fsm.trans("running");
    } else if (keys.right) {
      // this.fsm.trans("rightRun");
      this.fsm.trans("running");
    } else if (keys.forward) {
      this.fsm.trans("running");
    } else if (keys.backward) {
      // this.fsm.trans("runningBack");
      this.fsm.trans("running");
    } else {
      this.fsm.trans("idle");
    }
  }

  handleLeftClick() {
    const { stateKey } = this.getAction();
    this.attackStack += this.attackStack != 3 ? 1 : 0;

    if (stateKey == "hit") this.fsm.punchSecond();
    else this.fsm.punch();

    setTimeout(() => {
      this.attackStack -= this.attackStack != 0 ? 1 : 0;
    }, 1000);
  }

  handleRoll() {
    this.preventAction = true;
    const { stateAction, prevStateAction } = this.getAction();

    if (stateAction) {
      const mixer = stateAction.getMixer();

      stateAction.reset();
      stateAction.enabled = true;
      stateAction.clampWhenFinished = true;
      stateAction.loop = THREE.LoopOnce;

      stateAction.crossFadeFrom(prevStateAction as AnimationAction, 0.1, true);

      const onComplete = () => {
        this.preventAction = false;

        mixer.removeEventListener("finished", onComplete);
      };

      mixer.addEventListener("finished", onComplete);

      stateAction.play();
    }
  }

  handlePunch(state: "hit" | "hitSecond") {
    this.preventAction = true;
    const { stateAction, prevStateAction } = this.getAction(state);

    if (stateAction) {
      const mixer = stateAction.getMixer();

      stateAction.reset();
      stateAction.clampWhenFinished = true;
      stateAction.loop = THREE.LoopOnce;

      stateAction.crossFadeFrom(prevStateAction as AnimationAction, 0.2, true);

      const onComplete = () => {
        this.preventAction = false;

        this.attackStack -= this.attackStack != 0 ? 1 : 0;
        mixer.removeEventListener("finished", onComplete);
      };

      mixer.addEventListener("finished", onComplete);

      stateAction.play();
    }
  }

  handleTrans() {
    const { stateKey, stateAction, prevStateKey, prevStateAction } =
      this.getAction();

    if (prevStateAction && stateAction) {
      if (prevStateKey != stateKey && !stateAction.isRunning()) {
        stateAction.time = 0.0;
        stateAction.enabled = true;
        stateAction.setEffectiveTimeScale(1.0);
        stateAction.setEffectiveWeight(1.0);

        stateAction.crossFadeFrom(
          prevStateAction as AnimationAction,
          0.3,
          true
        );
        stateAction.play();
      }
    } else {
      stateAction?.play();
    }
  }

  getAction(state?: keyof typeof this.animations) {
    const stateKey: keyof typeof this.animations = state || this.fsm.state;
    const stateAction = this.animations[stateKey];

    const prevStateKey: keyof typeof this.animations =
      this.fsm.history[this.fsm.history.length - MAX_FSM_HISTORY];
    const prevStateAction = this.animations[prevStateKey];

    return {
      stateKey,
      stateAction,
      prevStateKey,
      prevStateAction,
    };
  }

  update(deltaT: number) {
    this.handleAnimation();
  }
}
