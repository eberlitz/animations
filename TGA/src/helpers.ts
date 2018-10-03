import * as THREE from "three";

export function addButton(text: string, action: () => void) {
  const toolsEl = document.querySelector("#tools");
  var btn = document.createElement("BUTTON");
  btn.innerHTML = text;
  toolsEl.appendChild(btn);
  btn.addEventListener("click", action, false);
  return () => {
    toolsEl.removeChild(btn);
  };
}

export function createCirclePoints(r = 30) {
  const slice = (2 * Math.PI) / 1000;
  let t = 0.0;
  const circle: THREE.Vector3[] = [];
  while (t < 2 * Math.PI) {
    circle.push(new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), 0.0));
    t += slice;
  }
  return circle;
}

export function createLineBetweenPoints(points) {
  var geometry = new THREE.BufferGeometry().setFromPoints(
    points //.concat(points[0])
  );
  var line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.5 })
  );
  return line;
}

export function createArrow(position: THREE.Vector3) {
  var geometry = new THREE.ConeGeometry(3, 10, 32);
  var material = new THREE.MeshBasicMaterial({
    // color: 0x000000,
    opacity: 0.9,
    color: 0x444444,
    flatShading: true
  });
  var cone = new THREE.Mesh(geometry, material);
  cone.position.copy(position);
  return cone;
}

export function createDot(position: THREE.Vector3) {
  var dotGeometry = new THREE.Geometry();
  dotGeometry.vertices.push(position);
  var dotMaterial = new THREE.PointsMaterial({
    size: 10,
    sizeAttenuation: false,
    color: 0x000000
  });
  return new THREE.Points(dotGeometry, dotMaterial);
}

export function createBox() {
  const geometry = new THREE.BoxGeometry(10, 10, 10);
  const material = new THREE.MeshPhongMaterial({
    color: 0x444444,
    flatShading: true
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  return mesh;
}

export function addLight() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  return ambient;
  // const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  // hemiLight.color.setHSL(0.6, 1, 0.6);
  // hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  // hemiLight.position.set(0, 50, 0);
  // return hemiLight;
}

// Draw arrow from point to point
// points.reduce((p1, p2) => {
//   if (p1) {
//     // 1. ArrowHelper
//     var from = p1;
//     var to = p2;
//     var direction = to.clone().sub(from);
//     var length = direction.length();

//     const arrowHelper = new THREE.ArrowHelper(direction.normalize(), from, length, 0xff0000); // 100 is length, 20 and 10 are head length and width
//     scene.add(arrowHelper);
//   }
//   return p2;
// });

export function TextureAnimator(
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
