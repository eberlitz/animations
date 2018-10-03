import * as THREE from "three";
import "./lib/OrbitControls";
import "./lib/GPUParticleSystem";
import * as helpers from "./helpers";

(window as any).THREE = THREE;
import SPE from "shader-particle-engine";

import Simple from "./particles/simple";
/*
TODO:
- Multiplayer
- Explosion
- Portal Bullets
- Bullets
*/

// import runnerImage from "./assets/run.png";

// import soundUrl from "./assets/376737_Skullbeatz___Bad_Cat_Maste.mp3";
import soundUrl from "./assets/AssaultOnMistCastle.ogg";
import backgroundUrl from "./assets/spaceshooter/Backgrounds/black.png";
import playerShipUrl from "./assets/spaceshooter/PNG/playerShip1_blue.png";
import ufoBlueUrl from "./assets/spaceshooter/PNG/ufoBlue.png";
import ufoGreenUrl from "./assets/spaceshooter/PNG/ufoGreen.png";
import ufoRedUrl from "./assets/spaceshooter/PNG/ufoRed.png";
import ufoYellowUrl from "./assets/spaceshooter/PNG/ufoYellow.png";

import smokeParticleUrl from "./assets/smokeparticle.png";
import spriteExplosion2Url from "./assets/sprite-explosion2.png";

const textureLoader = new THREE.TextureLoader();

let totalEnemies = 0;
const MAX_ENEMIES = 50;
const enemyTextures = [ufoBlueUrl, ufoGreenUrl, ufoRedUrl, ufoYellowUrl].map(
  url => textureLoader.load(url)
);

const spriteExplosionTexture = textureLoader.load(spriteExplosion2Url);
var group = new SPE.Group({
    texture: {
      value: spriteExplosionTexture,
      frames: new THREE.Vector2(5, 5),
      loop: 1
    },
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    maxParticleCount: 3000,
    scale: 600
  }),
  shockwaveGroup = new SPE.Group({
    maxParticleCount: 3000,
    texture: {
      value: textureLoader.load(smokeParticleUrl)
    },
    depthTest: false,
    depthWrite: true,
    blending: THREE.NormalBlending
  }),
  debris = {
    particleCount: 100,
    type: SPE.distributions.SPHERE,
    position: {
      radius: 0.1
    },
    maxAge: {
      value: 2
    },
    // duration: 2,
    activeMultiplier: 40,

    velocity: {
      value: new THREE.Vector3(100)
    },
    acceleration: {
      value: new THREE.Vector3(0, -20, 0),
      distribution: SPE.distributions.BOX
    },
    size: { value: 2 },
    drag: {
      value: 1
    },
    color: {
      value: [
        new THREE.Color(1, 1, 1),
        new THREE.Color(1, 1, 0),
        new THREE.Color(1, 0, 0),
        new THREE.Color(0.4, 0.2, 0.1)
      ]
    },
    opacity: { value: [0.4, 0] }
  },
  fireball = {
    particleCount: 20,
    type: SPE.distributions.SPHERE,
    position: {
      radius: 1
    },
    maxAge: { value: 2 },
    // duration: 1,
    activeMultiplier: 20,
    velocity: {
      value: new THREE.Vector3(10)
    },
    size: { value: [20, 100] },
    color: {
      value: [new THREE.Color(0.5, 0.1, 0.05), new THREE.Color(0.2, 0.2, 0.2)]
    },
    opacity: { value: [0.5, 0.35, 0.1, 0] }
  },
  mist = {
    particleCount: 50,
    position: {
      spread: new THREE.Vector3(10, 10, 10),
      distribution: SPE.distributions.SPHERE
    },
    maxAge: { value: 2 },
    // duration: 1,
    activeMultiplier: 2000,
    velocity: {
      value: new THREE.Vector3(8, 3, 10),
      distribution: SPE.distributions.SPHERE
    },
    size: { value: 40 },
    color: {
      value: new THREE.Color(0.2, 0.2, 0.2)
    },
    opacity: { value: [0, 0, 0.2, 0] }
  },
  flash = {
    particleCount: 50,
    position: { spread: new THREE.Vector3(5, 5, 5) },
    velocity: {
      spread: new THREE.Vector3(30),
      distribution: SPE.distributions.SPHERE
    },
    size: { value: [2, 20, 20, 20] },
    maxAge: { value: 2 },
    activeMultiplier: 2000,
    opacity: { value: [0.5, 0.25, 0, 0] }
  };

group.addPool(MAX_ENEMIES, fireball, true);
shockwaveGroup.addPool(MAX_ENEMIES, mist, true);

const speed = 3.0;
const playerControls = {
  left: 0,
  right: 0,
  up: 0,
  down: 0,
  space: 0
};
const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4( position, 1.0 );
}
`;

const fragmentShader = `
uniform sampler2D tAudioData;
varying vec2 vUv;
void main() {
    vec3 backgroundColor = vec3( 0.0, 0.0, 0.0 );
    vec3 color = vec3( 1.0, 1.0, 0.0 );
    float f = texture2D( tAudioData, vec2( vUv.x, 0.0 ) ).r;
    float i = step( vUv.y, f ) * step( f - 0.0125, vUv.y );
    gl_FragColor = vec4( mix( backgroundColor, color, i ), 1.0 );
}`;

export function startSound(camera: THREE.Camera, scene: THREE.Scene) {
  // create an AudioListener and add it to the camera
  var listener = new THREE.AudioListener();
  camera.add(listener);

  // create a global audio source
  var sound = new THREE.Audio(listener);

  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    soundUrl,
    function(buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.5);
      sound.play();
    },
    undefined,
    undefined
  );

  // create an AudioAnalyser, passing in the sound and desired fftSize
  const fftSize = 32;
  var analyser = new THREE.AudioAnalyser(sound, fftSize);
  const uniforms = {
    tAudioData: {
      value: new THREE.DataTexture(
        analyser.data,
        fftSize / 2,
        1,
        THREE.LuminanceFormat
      )
    }
  };
  var material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
  });
  var geometry = new THREE.PlaneBufferGeometry(1, 1);
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const delta = [];

  let last;

  const range = 25;

  return () => {
    analyser.getFrequencyData();
    let current = analyser.data;
    if (last) {
      delta.push(last.map((x, i) => x - current[i]));
      if (delta.length > range) {
        delta.shift();
      }
    }
    // console.table(delta);
    last = current.slice(0);

    if (delta.length === range) {
      var sumOfAll = delta
        .map(row =>
          //toArray
          [].slice
            .call(row, 0)
            // normalize
            .map(a => a / 255)
        )
        .reduce((ant, atual, ci) => {
          return ant.map((x, i) => (x * 0.8 + atual[i]) / 2);
        })
        .map((a, i) => {
          if ((i == 0 || i == 15 || i == 14 || i == 13) && a > 0.8) {
            createEnemy(getYPos());
          }

          return a;
        });

      // console.log(sumOfAll);
    }
    // console.log(delta[delta.length-1])
    uniforms.tAudioData.value.needsUpdate = true;
  };
}

const untypedWindow = window as any;
untypedWindow.THREE = THREE;
if (untypedWindow.ref) {
  cancelAnimationFrame(untypedWindow.ref);
}
const appEl = document.getElementById("app");

const scene = new THREE.Scene();
const clock = new THREE.Clock();
const animations = [new Simple(scene).activate()];

scene.add(helpers.addLight());

function trigger(at: THREE.Vector3) {
  group.triggerPoolEmitter(1, at);
  shockwaveGroup.triggerPoolEmitter(1, at);
}

scene.add(shockwaveGroup.mesh);
scene.add(group.mesh);

var spaceRadius = 300;
var texture = textureLoader.load(backgroundUrl),
  segments = 64,
  material = new THREE.MeshBasicMaterial({
    // color: 0x0000ff,
    map: texture,
    transparent: true,
    opacity: 0.9
  });
var space = new THREE.Mesh(
  new THREE.CircleGeometry(spaceRadius, segments),
  material
);
space.position.z = -10;
scene.add(space);

// To get a closed circle use LineLoop instead (see also @jackrugile his comment):
// scene.add( new THREE.LineLoop( geometry, material ) );

// scene.add(new THREE.AmbientLight(0x404040));
// const dl = new THREE.DirectionalLight(0xc0c0c0);
// dl.position.set(0, 0, 0);
// scene.add(dl);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});
renderer.setClearColor(0x000000, 0);
appEl.appendChild(renderer.domElement);

const frustumSize = 300;
var aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  1000
);
// const camera = new THREE.PerspectiveCamera(35, 0, 0.0001, 10000);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 150;
camera.zoom = 1;
(window as any).camera = camera;

// const controls = new THREE.OrbitControls(camera, renderer.domElement);

// const textureLoader = new THREE.TextureLoader();
// var runnerTexture = textureLoader.load(runnerImage);

// var annie = new TextureAnimator(runnerTexture, 10, 1, 10, 75); // texture, #horiz, #vert, #total, duration.
// var runnerMaterial = new THREE.MeshBasicMaterial({
//   map: runnerTexture,
//   side: THREE.FrontSide,
//   transparent: true,
//   depthWrite: false,
//   // blending: THREE.AdditiveBlending,
//   // opacity: 0.5
// });
// var runnerGeometry = new THREE.PlaneGeometry(25, 25, 1, 1);
// var runner = new THREE.Mesh(runnerGeometry, runnerMaterial);
// runner.position.set(50, 25, 0);
// scene.add(runner);

function createEnemy(y: number) {
  if (totalEnemies == MAX_ENEMIES) return;
  console.log("create");
  const enemyTexture =
    enemyTextures[Math.floor(Math.random() * enemyTextures.length)];
  var geometry = new THREE.BoxBufferGeometry(10, 10, 1, 1, 1, 1);
  const enemy = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: enemyTexture,
      transparent: true,
      opacity: 0.9
      // color: 0xff0000
    })
  );
  const enemyBox = new THREE.Box3();

  enemy.position.x = spaceRadius;

  const turbulence = Math.random();
  const getNext = () => Math.random() * turbulence * 50 - 25 * turbulence;

  let points = [
    new THREE.Vector3(spaceRadius, y + getNext(), 0),
    // new THREE.Vector3(100, y + getNext(), 0),
    new THREE.Vector3(spaceRadius / 2, y + getNext(), 0),
    // new THREE.Vector3(25, y + getNext(), 0),
    new THREE.Vector3(0, y + getNext(), 0),
    // new THREE.Vector3(-25, y + getNext(), 0),
    new THREE.Vector3(-spaceRadius / 2, y + getNext(), 0),
    // new THREE.Vector3(-100, y + getNext(), 0),
    new THREE.Vector3(-spaceRadius, y + getNext(), 0)
  ];

  const [axis, angle] = [
    new THREE.Vector3(0, 0, 1),
    Math.random() * 2 * Math.PI
  ];

  points = points.map(p => p.applyAxisAngle(axis, angle));

  const pathFn = createCatmullRomPath(
    points,
    Math.random() > 0.8 ? 4000 : 5000,
    false
  );

  let tick = 0;
  const animator = {
    animate: (time: number, delta: number) => {
      tick += delta;
      const t = tick * 1000;
      const position = pathFn(t);
      if (position) {
        enemy.position.copy(position);
        const next = pathFn(t + 0.1);
        if (next) {
          enemy.lookAt(next);
          enemy.rotateY(Math.PI / 2);
        }
      } else {
        const idx = animations.indexOf(animator);
        idx !== -1 && animations.splice(idx, 1);
        scene.remove(enemy);
        totalEnemies--;
      }
      playerBox.setFromObject(player);
      enemyBox.setFromObject(enemy);
      if (playerBox.intersectsBox(enemyBox)) {
        trigger(enemy.position.clone());
        const idx = animations.indexOf(animator);
        idx !== -1 && animations.splice(idx, 1);
        scene.remove(enemy);
        totalEnemies--;
      }
    }
  } as any;

  animations.push(animator);

  totalEnemies++;
  scene.add(enemy);
}

const getYPos = () => Math.random() * 150 * 2 - 150;

var geometry = new THREE.BoxBufferGeometry(10, 10, 1, 1, 1, 1);
var playerShipTexture = textureLoader.load(playerShipUrl);

const player = new THREE.Mesh(
  geometry,
  new THREE.MeshBasicMaterial({
    map: playerShipTexture,
    transparent: true,
    opacity: 0.9
    //color: 0x000000
  })
);
const playerBox = new THREE.Box3();
scene.add(player);
const soundAnalyserUpdate = startSound(camera, scene);

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
      playerControls.right = 1;
      break;
    case "a":
    case "ArrowLeft":
      playerControls.left = 1;
      break;
    case "w":
    case "ArrowUp":
      playerControls.up = 1;
      break;
    case "s":
    case "ArrowDown":
      playerControls.down = 1;
      break;
    case " ":
      playerControls.space = 1;
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
      playerControls.right = 0;
      break;
    case "a":
    case "ArrowLeft":
      playerControls.left = 0;
      break;
    case "w":
    case "ArrowUp":
      playerControls.up = 0;
      break;
    case "s":
    case "ArrowDown":
      playerControls.down = 0;
      break;
    case " ":
      shoot();
      playerControls.space = 0;
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

  camera.left = (-frustumSize * aspect) / 2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  // const dpr = window.devicePixelRatio > 1 ? 2 : 1;

  // camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // renderer.setPixelRatio(dpr);

  renderer.setSize(width, height);
}

(window as any).player = player;

function loop(time: number = 0) {
  (window as any).ref = requestAnimationFrame(loop);
  const delta = clock.getDelta();

  // Update Player position
  const deltaX = playerControls.right - playerControls.left;
  const deltaY = playerControls.up - playerControls.down;
  const newX = player.position.x + deltaX * speed;
  const newY = player.position.y + deltaY * speed;
  const newPosition = new THREE.Vector3(newX, newY, 0);
  if (newPosition.length() < spaceRadius) {
    camera.position.x = player.position.x = newX;
    camera.position.y = player.position.y = newY;
  }
  if (deltaX || deltaY) {
    player.rotation.z = Math.atan2(deltaY, deltaX) - Math.PI / 2;
  }
  playerBox.setFromObject(player);

  // animate explosions
  group.tick(delta);
  shockwaveGroup.tick(delta);

  animations.forEach(a => a.animate(time, delta));
  soundAnalyserUpdate();
  // controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
  renderer.render(scene, camera);
  // annie.update(1000 * delta);
}

function TextureAnimator(
  texture: THREE.Texture,
  tilesHoriz,
  tilesVert,
  numTiles,
  tileDispDuration
) {
  // note: texture passed by reference, will be updated by the update function.

  this.tilesHorizontal = tilesHoriz;
  this.tilesVertical = tilesVert;
  // how many images does this spritesheet contain?
  //  usually equals tilesHoriz * tilesVert, but not necessarily,
  //  if there at blank tiles at the bottom of the spritesheet.
  this.numberOfTiles = numTiles;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical);
  // how long should each image be displayed?
  this.tileDisplayDuration = tileDispDuration;

  // how long has the current image been displayed?
  this.currentDisplayTime = 0;

  // which image is currently being displayed?
  this.currentTile = 0;

  this.update = function(milliSec) {
    this.currentDisplayTime += milliSec;
    while (this.currentDisplayTime > this.tileDisplayDuration) {
      this.currentDisplayTime -= this.tileDisplayDuration;
      this.currentTile++;
      if (this.currentTile == this.numberOfTiles) this.currentTile = 0;
      var currentColumn = this.currentTile % this.tilesHorizontal;
      texture.offset.x = currentColumn / this.tilesHorizontal;
      var currentRow = Math.floor(this.currentTile / this.tilesHorizontal);
      texture.offset.y = currentRow / this.tilesVertical;
    }
  };
}

function createCatmullRomPath(
  points: THREE.Vector3[],
  velocity = 1000,
  loop = false
) {
  const curve = new THREE.CatmullRomCurve3(points);
  curve.getLength();
  let last;
  return function(t: number) {
    const u = (t % velocity) / velocity;
    if (!loop && last > u) {
      return;
    }
    last = u;
    return curve.getPointAt(u);
    // return curve.getPointAt(t % curve.getLength());
  };
}

const shots = [];
var shotMtl = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.5
});

function shoot() {
  const shot = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16), shotMtl);
  const shotBox = new THREE.Box3();
  shot.position.copy(player.position);

  let tick = 0;
  const animator = {
    animate: (time: number, delta: number) => {
      tick += delta;
      const t = tick * 1000;

      // TODO: update shot position
      const speed = 3.0;
      // shot.translateX(speed);
      // shot.translateY(speed);
      // shot.translateZ(speed);

      const direction = shot.getWorldDirection(new THREE.Vector3());
      shot.position.add(direction.multiplyScalar(speed));


      // IS OUT OF SIGHT
      if (shot.position.length() >= spaceRadius) {
        destroy();
      } else {
        shotBox.setFromObject(shot);
      }
    }
  } as any;

  shots.push(shot);
  animations.push(animator);
  scene.add(shot);
  // ---------------
  function destroy() {
    let idx = animations.indexOf(animator);
    idx !== -1 && animations.splice(idx, 1);
    idx = shots.indexOf(shot);
    idx !== -1 && shots.splice(idx, 1);
    scene.remove(shot);
  }
}
