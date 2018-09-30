import * as THREE from "three";
import "../lib/GPUParticleSystem";
import * as helpers from "../helpers";
import particleUrl from "../../textures/particle2.png";
import perlinUrl from "../../textures/perlin-512.png";
import explosionUrl from "../assets/Explosion/explosion00.png";

import * as d3 from "d3-interpolate";

declare module "three" {
  let GPUParticleSystem: any;
}

var textureLoader = new THREE.TextureLoader();

export default class Simple {
  points: THREE.Vector3[] = [];
  currentPoint?: THREE.Mesh = undefined;
  disposables = [];
  clock = new THREE.Clock();

  pathFn = circular;
  options = {
    position: new THREE.Vector3(),
    positionRandomness: 0.5,
    velocity: new THREE.Vector3(),
    velocityRandomness: 0.1,
    color: 0xff8888,
    colorRandomness: 0.1,
    turbulence: 0.1,
    lifetime: 0.4,
    size: 25,
    sizeRandomness: 0.9,
    smoothPosition: false
  };
  particleSystem = new THREE.GPUParticleSystem({
    maxParticles: 250000,
    particleNoiseTex: textureLoader.load(perlinUrl),
    particleSpriteTex: textureLoader.load(explosionUrl)
  });
  tick = 0;
  timeScale: number = 1;
  velocity = 10;
  constructor(private scene: THREE.Scene) {}

  addToScene(object: THREE.Object3D) {
    this.scene.add(object);
    this.disposables.push(() => this.scene.remove(object));
  }

  activate() {
    this.scene.background = new THREE.Color(0, 0, 0);
    var interpolateColor = d3.interpolate("#aa88ff", "#ff6b6b");
    console.log(new THREE.Color(interpolateColor(0.1)));

    // this.disposables.push(
    //   LinearLoop([[0, 1, 4000]], value => {
    //     this.options.color = new THREE.Color(interpolateColor(value));
    //   })
    // );
    this.addToScene(this.particleSystem);

    // setInterval(() => {
    //   for (var x = 0; x < 10; x++) {
    //     this.particleSystem.spawnParticle(this.options);
    //   }
    // }, 3000);

    return this;
  }

  deactivate() {
    this.disposables.splice(0).forEach(d => d());
    this.currentPoint = undefined;
  }

  animate(time: number, delta: number) {
    this.tick += delta * this.timeScale;

    const t = this.velocity * this.tick;
    // const currentPosition = this.pathFn(t);
    const currentPosition = new THREE.Vector3(0, 0, 0);

    // if (currentPosition && this.timeScale > 0) {
    //   this.options.position = currentPosition.clone();
    //   for (var x = 0; x < 1 * delta; x++) {
    //     console.log(`${this.tick}`);
    //     if (Math.floor(this.tick) % 5 == 0) {
    //       this.particleSystem.spawnParticle(this.options);
    //     }
    //   }
    // }

    this.particleSystem.update(this.tick);
  }

  positionFromT(t: number) {
    t = t / (Math.PI * 2);
    const r = t * 0.5;
    return new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), t);
  }

  createPoints(maxT, slice) {
    // const slice = (2 * Math.PI) / 1000;
    let t = 0.0;
    const points: THREE.Vector3[] = [];
    while (t < maxT) {
      points.push(this.pathFn(t));
      t += slice;
    }
    return points;
  }
}

function createCatmullRomPath(points: THREE.Vector3[]) {
  const curve = new THREE.CatmullRomCurve3(points);
  curve.getLength();
  return function(t: number) {
    return curve.getPointAt((t % 100) / 100);
    // return curve.getPointAt(t % curve.getLength());
  };
}

function circular(t: number) {
  t = t / (Math.PI * 2);
  const r = 30;
  return new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), 0);
}

function espiral(t: number) {
  t = t / (Math.PI * 2);
  const r = t * 0.5;
  return new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), t);
}

interface KeyFrame {
  from: number;
  to: number;
  duration: number;
  startAt: number;
  endAt: number;
  delta: number;
}

function toKeyframeObject(keyframes: Array<[number, number, number]>) {
  let endAt = 0;
  const keyframesObj = keyframes.map(k => {
    const [from, to, duration] = k;
    const startAt = endAt;
    endAt += duration;
    const delta = to - from;
    return { from, to, duration, startAt, endAt, delta } as KeyFrame;
  });
  return keyframesObj;
}

function LinearLoop(keyframes: Array<[number, number, number]>, callback) {
  keyframes = keyframes.concat(keyframes
    .slice(0)
    .reverse()
    .map(a => [a[1], a[0], a[2]]) as any);
  const keyframesObj = toKeyframeObject(keyframes);
  const totalAnimationTime = keyframesObj[keyframesObj.length - 1].endAt;
  //   console.log(totalAnimationTime);

  //   var cKF = undefined;

  function animation(t: number) {
    //   console.log(t);
    let currentKeyframe = keyframesObj.find(
      frame => t <= frame.endAt / totalAnimationTime
    );
    // if (cKF !== currentKeyframe) {
    //   cKF = currentKeyframe;
    //   console.log(cKF, t);
    // }
    const totalElapsedTime = t * totalAnimationTime;
    const timeDelta = currentKeyframe.endAt - currentKeyframe.startAt;

    const currentTime = totalElapsedTime - currentKeyframe.startAt;
    const tForKeyframe = currentTime / timeDelta;
    // console.log((t * totalAnimationTime - currentKeyframe.startAt) / (currentKeyframe.endAt - currentKeyframe.startAt));
    return tForKeyframe * currentKeyframe.delta + currentKeyframe.from;
  }

  return infiniteStream(totalAnimationTime, animation, callback);
}

function stream<T>(
  duration: number,
  animation: (t: number) => T,
  cb: (v: T) => void,
  onEnd?: () => void
) {
  const start = window.performance.now ? performance.now() : Date.now();
  let handle = requestAnimationFrame(doFrame);
  return () => cancelAnimationFrame(handle);
  // ---------------------------------
  function doFrame(time: number) {
    const elapsed = Math.max(0, time - start);
    const t = Math.min(elapsed / duration, 1);
    cb(animation(t));
    if (t < 1) {
      handle = requestAnimationFrame(doFrame);
    } else {
      onEnd && onEnd();
    }
  }
}

function infiniteStream<T>(
  duration: number,
  animation: (t: number) => T,
  cb: (v: T) => void,
  onEnd?: () => void
) {
  let off;
  function restartLoop() {
    off = stream(duration, animation, cb, restartLoop);
  }
  restartLoop();
  return () => off && off();
}
