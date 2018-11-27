import * as THREE from "three";
import * as dat from 'dat.gui';

import Zlib from "zlibjs/bin/inflate.min.js";
(window as any).Zlib = Zlib.Zlib;

import StateMachine from 'javascript-state-machine';

function delay(millis: number) {
  return new Promise((resolve) => setTimeout(resolve, millis))
}

function every(millis: number, action: () => void) {
  const intervalId = setInterval(() => {
    action();
  }, millis)
  return () => clearInterval(intervalId);
}




const actions = {
  idle: () => { },
  dance: () => { },
  sit: () => { },
  stand: () => { },
  lay: () => { },
  stand2: () => { },
};
(window as any).actions = actions;

var disposables = [];

var fsm = new StateMachine({
  init: 'idle',
  transitions: [
    { name: 'dance', from: 'idle', to: 'dancing' },
    { name: 'sitFromDancing', from: 'dancing', to: 'resting' },
    { name: 'idleFromDancing', from: 'dancing', to: 'idle' },
    { name: 'sitFromIdle', from: 'idle', to: 'resting' },
    { name: 'stand', from: 'resting', to: 'idle' },
    { name: 'goSleep', from: 'resting', to: 'sleeping' },
    { name: 'wakeUp', from: 'sleeping', to: 'idle' },
  ],
  methods: {
    onLeaveState: () => disposables.splice(0).forEach(a => a()),
    onEnterSleeping:() => {
      disposables.push(every(3000, () => {
        if (innerState.energy <= 0.9) {
          innerState.energy += 0.1;
        }
        if (innerState.happy <= 0.9) {
          innerState.happy += 0.1;
        }
      }));
      return actions.lay();
    },
    onLeaveSleeping:() => actions.stand2(),

    onEnterIdle: () => {
      disposables.push(every(5000, () => {
        if (innerState.energy > 0.1) {
          innerState.energy -= 0.1;
        }
      }));
      return actions.idle();
    },
    onEnterDancing: () => {
      disposables.push(every(1000, () => {
        if (innerState.energy > 0.1) {
          innerState.energy -= 0.1;
        }
      }));
      return actions.dance();
    },
    onEnterResting: () => {
      disposables.push(every(4000, () => {
        if (innerState.energy <= 0.9) {
          innerState.energy += 0.1;
        }
      }));
      return actions.sit();
    },
    onLeaveResting: () => actions.stand(),
    // onMelt: () => { console.log('I melted') },
    // onFreeze: () => { console.log('I froze') },
    // onVaporize: () => { console.log('I vaporized') },
    // onCondense: () => { console.log('I condensed') }
  }
});


async function updateAnimations() {
  if (fsm.is('dancing') && innerState.energy < 0.3) {
    // await delay(1000);
    fsm.sitFromDancing();
  } else if (fsm.is('idle') && innerState.energy < 0.3) {
    // await delay(1000);
    fsm.sitFromIdle();
  } else if (fsm.is('resting') && innerState.happy <= 0.3){
    fsm.goSleep();
  } else if (fsm.is('resting') && innerState.energy >= 0.9) {
    // await delay(1000);
    fsm.stand();
  } else if (fsm.is('idle') && innerState.happy >= 0.8) {
    // await delay(1000);
    fsm.dance();
  } else if (fsm.is('dancing') && innerState.happy < 0.5) {
    // await delay(1000);
    fsm.idleFromDancing()
  } else if (fsm.is('sleeping') && innerState.energy >= 0.9 && innerState.happy >= 0.9){
    fsm.wakeUp();
  }
}



const gui = new dat.GUI();

const innerState = {
  happy: 0.1,
  energy: 1,
}

gui.add(innerState, 'happy', 0, 1).listen();
gui.add(innerState, 'energy', 0, 1).listen();

import "./lib/OrbitControls";
import "./lib/FBXLoader";

import FBXIdle from "./models/Idle.fbx";
import FBXDancing from "./models/Dancing.fbx";
import FBXSitting from "./models/Sitting.fbx";
import FBXStandUp from "./models/Stand Up.fbx";
import FBXLyingDown from "./models/Lying Down.fbx";
import FBXStandUp2 from "./models/Stand Up2.fbx";

var previousAction: THREE.AnimationAction;
var activeAction: THREE.AnimationAction;


const untypedWindow = window as any;
untypedWindow.THREE = THREE;
const appEl = document.getElementById("app");
if (untypedWindow.ref) {
  cancelAnimationFrame(untypedWindow.ref);
  while (appEl.children.length) {
    appEl.removeChild(appEl.firstChild);
  }
}

const mixers = [];

const textureLoader = new THREE.TextureLoader();

const scene = new THREE.Scene();
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer({
  // alpha: true,
  antialias: true
});
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x000000, 0);
appEl.appendChild(renderer.domElement);

var aspect = window.innerWidth / window.innerHeight;
// const camera = new THREE.OrthographicCamera(
//   (FRUSTUM_SIZE * aspect) / -2,
//   (FRUSTUM_SIZE * aspect) / 2,
//   FRUSTUM_SIZE / 2,
//   FRUSTUM_SIZE / -2,
//   1,
//   4000
// );
const camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
camera.position.set(100, 200, 300);

camera.updateMatrixWorld(true);
(window as any).camera = camera;

scene.background = new THREE.Color(0xa0a0a0);
scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

let light: any = new THREE.HemisphereLight(0xffffff, 0x444444);
light.position.set(0, 200, 0);
scene.add(light);
light = new THREE.DirectionalLight(0xffffff);
light.position.set(0, 200, 100);
light.castShadow = true;
light.shadow.camera.top = 180;
light.shadow.camera.bottom = -100;
light.shadow.camera.left = -120;
light.shadow.camera.right = 120;
scene.add(light);

// ground
var mesh = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(2000, 2000),
  new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
);
mesh.rotation.x = -Math.PI / 2;
mesh.receiveShadow = true;
scene.add(mesh);
var grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
grid.material.opacity = 0.2;
grid.material.transparent = true;
scene.add(grid);

// var geometry = new THREE.BoxGeometry(1, 1, 1);
// var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// var cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
// controls.enableKeys = false;
controls.target.set(0, 0, 0);

const animations = [];
let currentAnimationIdx = undefined;

function changeAnimation() {
  animations.forEach(obj => {
    scene.remove(obj);
  });
  if (currentAnimationIdx === undefined) {
    currentAnimationIdx = animations.length - 1;
  }
  currentAnimationIdx++;
  if (currentAnimationIdx > animations.length - 1) {
    currentAnimationIdx = 0;
  }

  scene.add(animations[currentAnimationIdx]);
}

var loader = new THREE.FBXLoader();

loader.load(FBXIdle, (object: any) => {
  const mixer = object.mixer = new THREE.AnimationMixer(object);
  // (object as THREE.Object3D).scale.setScalar(5);
  object.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  const animation = object.animations[0];
  const action = mixer.clipAction(animation);
  actions.idle = () => {
    fadeToAction(action, 1);
    return delay(1000);
  };
  actions.idle();

  mixers.push(mixer);
  animations.push(object);
  changeAnimation();

  function loadAction(url) {
    return new Promise<THREE.AnimationAction>((resolve) => {
      loader.load(url, (otherObject: any) => {
        const animation = otherObject.animations[0];
        object.animations.push(animation);
        const action = mixer.clipAction(animation);
        resolve(action);
      });
    });
  }
  Promise.all([FBXDancing, FBXSitting, FBXStandUp, FBXLyingDown, FBXStandUp2].map(loadAction))
    .then((result) => {
      ["dance", "sit", "stand", "lay", "stand2"].reduce((p, c, i) => {
        const action = result[i];
        if (c === "sit" || c === "stand" || c === "stand2" || c === "lay") {
          action.clampWhenFinished = true;
          action.setLoop(THREE.LoopOnce, 1);
        }
        p[c] = () => {
          fadeToAction(action, 1);
          return delay(1000);
        };
        return p;
      }, actions);
    })
  // action.clampWhenFinished = true;
  // action.loop = THREE.LoopOnce;
  // fadeToAction(action, 1);



});

(window as any).fadeToAction = fadeToAction;
function fadeToAction(action: THREE.AnimationAction, duration: number) {
  previousAction = activeAction;
  activeAction = action;
  if (previousAction && previousAction !== activeAction) {
    previousAction.fadeOut(duration);
  }
  activeAction
    .reset()
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(duration)
    .play();
}



// [FBX1, FBX2, FBX3, FB4].forEach(anim => {
//   loader.load(anim, (object: any) => {
//     object.mixer = new THREE.AnimationMixer(object);
//     (object as THREE.Object3D).scale.setScalar(5);
//     mixers.push(object.mixer);
//     var action = object.mixer.clipAction(object.animations[0]);
//     action.play();
//     object.traverse(function (child) {
//       if (child.isMesh) {
//         child.castShadow = true;
//         child.receiveShadow = true;
//       }
//     });
//     animations.push(object);
//     changeAnimation();
//   });
// });

window.addEventListener("resize", onResize, false);
window.addEventListener("keyup", onKeyUp, false);
window.addEventListener("keydown", onKeyDown, false);
onResize();
loop();

function onKeyDown(evt: KeyboardEvent) {
  let prevent = true;
  switch (evt.key) {
    case "d":
    case "ArrowRight":
      changeAnimation();
      // playerControls.right = 1;
      break;
    case "a":
    case "ArrowLeft":
      // playerControls.left = 1;
      break;
    case "w":
    case "ArrowUp":
      // playerControls.up = 1;
      break;
    case "s":
    case "ArrowDown":
      // playerControls.down = 1;
      break;
    case " ":
      // playerControls.space = 1;
      break;
    default:
      prevent = false;
      break;
  }
  if (prevent) {
    evt.preventDefault();
  }
}

function onKeyUp(evt: KeyboardEvent) {
  let prevent = true;
  switch (evt.key) {
    case "d":
    case "ArrowRight":
      // playerControls.right = 0;
      break;
    case "a":
    case "ArrowLeft":
      // playerControls.left = 0;
      break;
    case "w":
    case "ArrowUp":
      // playerControls.up = 0;
      break;
    case "s":
    case "ArrowDown":
      // playerControls.down = 0;
      break;
    case " ":
      // shoot();
      // playerControls.space = 0;
      break;
    default:
      prevent = false;
      break;
  }
  if (prevent) {
    evt.preventDefault();
  }
}

function onResize(evt?: any) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;

  // camera.left = (-FRUSTUM_SIZE * aspect) / 2;
  // camera.right = (FRUSTUM_SIZE * aspect) / 2;
  // camera.top = FRUSTUM_SIZE / 2;
  // camera.bottom = -FRUSTUM_SIZE / 2;
  const dpr = window.devicePixelRatio > 1 ? 2 : 1;

  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(dpr);

  renderer.setSize(width, height);
}

function loop(time: number = 0) {
  (window as any).ref = requestAnimationFrame(loop);
  const delta = clock.getDelta();

  if (mixers.length > 0) {
    for (var i = 0; i < mixers.length; i++) {
      mixers[i].update(delta);
    }
  }

  updateAnimations();

  renderer.render(scene, camera);
  // controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
}



// https://github.com/mrdoob/three.js/tree/master/examples/models
// type Fn=() => void

// class StackFSM {
//     private stack: Array<Fn> = [];

//     update() {
//         var currentStateFunction = this.getCurrentState();
//         if (currentStateFunction != null) {
//             currentStateFunction();
//         }
//     }

//     popState() {
//         return this.stack.pop();
//     }

//     pushState(state: Fn): void {
//         if (this.getCurrentState() != state) {
//             this.stack.push(state);
//         }
//     }

//     getCurrentState(): Fn {
//         return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
//     }
// }