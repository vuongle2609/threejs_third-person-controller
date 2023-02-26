// character
export const SPEED = 16;
export const GRAVITY = 63;
export const JUMP_FORCE = 20;

export const ROLL_DOWN_FORCE = -5;
export const ROLL_UP_FORCE = 5;

// camera
export const FOV = 28;
export const ASPECT = window.innerWidth / window.innerHeight;
export const NEAR = 1.0;
export const FAR = 20000;
export const CAMERA_HEIGHT_FROM_CHARACTER = 30;
export const CAMERA_FAR_FROM_CHARACTER = CAMERA_HEIGHT_FROM_CHARACTER * 1.36;

export const CAMERA_ROTATION_OFFSET_CHARACTER = 16;
export const CAMERA_LERP_ALPHA = 0.05;
