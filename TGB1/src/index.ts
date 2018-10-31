import * as THREE from "three";
// import "./lib/inflate.min.js";
import Zlib from 'zlibjs/bin/inflate.min.js';
(window as any).Zlib = Zlib.Zlib;

import "./lib/OrbitControls";
import "./lib/FBXLoader";

import FBXBoxing from "./models/Boxing.fbx";
import FBXSambaDancing from "./models/Samba Dancing.fbx";
import FBXWalking from "./models/Walking.fbx";


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

// scene.add(helpers.addLight());

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
const camera = new THREE.PerspectiveCamera(
  45,
  aspect,
  1,
  10000
);
// camera.position.x = 0;
// camera.position.y = 0;
// camera.position.z = 75;
// camera.zoom = 1;
// camera.lookAt(new THREE.Vector3(0, 0, 0));
// camera.updateMatrix();

camera.position.set(100, 200, 300);

// camera.lookAt(new THREE.Vector3(0, 1, 0));
// camera.updateMatrix();

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
var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
mesh.rotation.x = - Math.PI / 2;
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

function changeAnimation(){
  animations.forEach(obj=>{
    scene.remove(obj);
  })
  if (currentAnimationIdx === undefined){
    currentAnimationIdx = animations.length-1;
  }
  currentAnimationIdx++;
  if (currentAnimationIdx > (animations.length -1)){
    currentAnimationIdx = 0;
  }

  scene.add(animations[currentAnimationIdx]);

}

var loader = new THREE.FBXLoader();
[
  FBXBoxing,
  FBXSambaDancing,
  FBXWalking
].forEach((anim) => {
  loader.load(anim, (object: any) => {
    object.mixer = new THREE.AnimationMixer(object);
    mixers.push(object.mixer);
    var action = object.mixer.clipAction(object.animations[0]);
    action.play();
    object.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // scene.add(object);
    animations.push(object);
    changeAnimation();
  });
})

// // model
// loader.load(FBXBoxing, function (object: any) {
//   object.mixer = new THREE.AnimationMixer(object);
//   mixers.push(object.mixer);
//   var action = object.mixer.clipAction(object.animations[0]);
//   action.play();
//   object.traverse(function (child) {
//     if (child.isMesh) {
//       child.castShadow = true;
//       child.receiveShadow = true;
//     }
//   });
//   scene.add(object);
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


  renderer.render(scene, camera);
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
}

