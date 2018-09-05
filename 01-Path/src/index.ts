import * as THREE from "three";
import "./OrbitControls";
import * as helpers from "./helpers";

import Linear from "./linear";
import Circular from "./circular";
import Espiral from "./espiral";
import Catmull from "./catmull";

const scene = new THREE.Scene();

const animMap = {
  linear: new Linear(scene),
  circular: new Circular(scene),
  espiral: new Espiral(scene),
  catmull: new Catmull(scene)
};

const animations = [animMap.linear.activate()];

if (window.ref) {
  cancelAnimationFrame(window.ref);
}

function startAnimation(name: string) {
  animations.splice(0).forEach(a => a.deactivate());
  let anim = animMap[name];
  anim.activate();
  animations.push(anim);
}

addButton("Linear", () => startAnimation("linear"));
addButton("Circular", () => startAnimation("circular"));
addButton("Espiral", () => startAnimation("espiral"));
addButton("Catmull Room Spline", () => startAnimation("catmull"));

function addButton(text: string, action: () => void) {
  const toolsEl = document.querySelector("#tools");
  var btn = document.createElement("BUTTON");
  btn.innerHTML = text;
  toolsEl.appendChild(btn);
  btn.addEventListener("click", action, false);
  return () => {
    toolsEl.removeChild(btn);
  };
}


const appEl = document.getElementById("app");

scene.add(helpers.addLight());
// scene.add(new THREE.AmbientLight(0x404040));
// const dl = new THREE.DirectionalLight(0xc0c0c0);
// dl.position.set(0, 0, 0);
// scene.add(dl);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});
appEl.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(35, 0, 0.0001, 10000);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 150;

const controls = new THREE.OrbitControls(camera, renderer.domElement);

window.addEventListener("resize", onResize);
onResize();
// const
loop();
// createBox();

function onResize(evt?: any) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio > 1 ? 2 : 1;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height);
}

function loop(time: number) {
  window.ref = requestAnimationFrame(loop);
  animations.forEach(a => a.animate(time));
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
  renderer.render(scene, camera);
}

// scene.add(createLineBetweenPoints(points));
