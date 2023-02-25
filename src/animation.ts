import { AnimationAction } from "three";
import BasicCharacterControllerInput from "./input";
import { CharacterAnimationType } from "./type";
import StateMachine from "javascript-state-machine";
import * as THREE from "three";

interface PropsType {
  animations: CharacterAnimationType;
  input: BasicCharacterControllerInput;
}
export default class Character_animation {
  animations: CharacterAnimationType;
  input: BasicCharacterControllerInput;
  prevAction: {
    name: string | undefined;
    action: AnimationAction | undefined;
  };
  currentAction: {
    name: string | undefined;
    action: AnimationAction | undefined;
  };
  preventAction = false;
  fsm: any;

  constructor({ animations, input }: PropsType) {
    this.input = input;
    this.animations = animations;
    const { running, runningBack, jump, leftRun, rightRun, idle, hit, getHit } =
      this.animations;

    // @ts-ignore
    this.fsm = new StateMachine({
      init: "idle",
      transitions: [
        { name: "punch", from: "*", to: "hit" },
        { name: "trans", from: "*", to: "*" },
      ],
      methods: {
        onPunch: () => {
          if (this.currentAction.action) {
            this.preventAction = true;
            const mixer = this.currentAction.action.getMixer();

            this.currentAction.action.enabled = true;
            this.currentAction.action.time = 0.0;
            this.currentAction.action.reset();
            this.currentAction.action.clampWhenFinished = true;
            this.currentAction.action.loop = THREE.LoopOnce;

            this.currentAction.action.crossFadeFrom(
              this.prevAction.action as AnimationAction,
              0.3,
              true
            );

            const onComplete = () => {
              this.prevAction = {
                name: "hit",
                action: hit,
              };

              if (this.currentAction.action)
                this.currentAction.action.enabled = false;
              this.currentAction.action?.stop();
              this.preventAction = false; 
              mixer.removeEventListener("finished", onComplete);
            };

            mixer.addEventListener("finished", onComplete);

            this.currentAction.action.play();
          }
        },
        onTrans: () => {
          if (this.prevAction) {
            if (
              this.prevAction?.name !== this.currentAction?.name &&
              this.currentAction?.action
            ) {
              this.currentAction.action.time = 0.0;
              this.currentAction.action.enabled = true;
              this.currentAction.action.setEffectiveTimeScale(1.0);
              this.currentAction.action.setEffectiveWeight(1.0);

              this.currentAction.action.crossFadeFrom(
                this.prevAction.action as AnimationAction,
                0.3,
                true
              );
              this.currentAction?.action?.play();
            }
          } else {
            this.currentAction?.action?.play();
          }

          this.prevAction = this.currentAction;
        },
      },
    });
  }

  handleAnimation() {
    const { keys } = this.input;
    const { running, runningBack, jump, leftRun, rightRun, idle, hit, getHit } =
      this.animations;

    if (keys.leftClick) {
      this.currentAction = {
        name: "hit",
        action: hit,
      };
      if (!this.preventAction) this.fsm.punch();
    } else if (keys.left) {
      this.currentAction = {
        name: "leftRun",
        action: leftRun,
      };
      if (!this.preventAction) this.fsm.trans();
    } else if (keys.right) {
      this.currentAction = {
        name: "rightRun",
        action: rightRun,
      };
      if (!this.preventAction) this.fsm.trans();
    } else if (keys.forward) {
      this.currentAction = {
        name: "running",
        action: running,
      };
      if (!this.preventAction) this.fsm.trans();
    } else if (keys.backward) {
      this.currentAction = {
        name: "runningBack",
        action: runningBack,
      };
      if (!this.preventAction) this.fsm.trans();
    } else {
      this.currentAction = {
        name: "idle",
        action: idle,
      };
      if (!this.preventAction) this.fsm.trans();
    }

    // if (!this.prevAction) this.fsm.trans();
  }

  update(deltaT: number) {
    this.handleAnimation();
  }
}
