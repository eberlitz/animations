import * as THREE from "three";
import "./lib/OrbitControls";
import "./lib/GPUParticleSystem";
import * as helpers from "./helpers";

import Simple from "./particles/simple";

const scene = new THREE.Scene();

const clock = new THREE.Clock();

// const animMap = {
//   simple: new Simple(scene),
// };

const animations = [new Simple(scene).activate()];

if (window.ref) {
  cancelAnimationFrame(window.ref);
}


// function startAnimation (name:string) {
//   animations.splice(0).forEach(a => a.deactivate());
//   let anim = animMap[name];
//   anim.activate();
//   animations.push(anim);
// }


// addButton("Linear",()=>startAnimation("linear"));
// addButton("Circular",()=>startAnimation("circular"));
// addButton("Espiral",()=>startAnimation("espiral"));
// addButton("Catmull Room Spline",()=>startAnimation("catmull"));
// addButton("Particles",()=>startAnimation("simple"));

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
loop();

function onResize(evt?: any) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio > 1 ? 2 : 1;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height);
}

function loop(time: number = 0) {
  window.ref = requestAnimationFrame(loop);
  const delta = clock.getDelta();
  animations.forEach(a => a.animate(time, delta));
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
  renderer.render(scene, camera);
}
