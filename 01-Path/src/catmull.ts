import * as THREE from "three";
import * as helpers from "./helpers";

export default class Catmull {
  points: THREE.Vector3[] = [];
  currentPoint?: THREE.Mesh = undefined;
  disposables = [];

  constructor(private scene: THREE.Scene) {}
  activate() {
    const vec3 = THREE.Vector3;
    this.points = [
      new vec3(0, 0, 0),
      new vec3(10, 10, 10),
      new vec3(15, 15, 10),
      new vec3(20, 20, 10),
      new vec3(30, 30, 0),
      new vec3(20, 30, 0),
      new vec3(10, 30, 0),
      new vec3(0, 20, 0),
      new vec3(2, 2, -12),
      new vec3(0, 0, 0)
    ];

    this.points.forEach(point => {
      const p = helpers.createDot(point);
      this.scene.add(p);
      this.disposables.push(() => this.scene.remove(p));
    });

    const curve = new THREE.CatmullRomCurve3(this.points);
    // curve.curveType = "centripetal"; //, chordal and catmullrom.
    this.points = curve.getSpacedPoints(100);

    const line = helpers.createLineBetweenPoints(this.points);
    this.scene.add(line);
    this.disposables.push(() => this.scene.remove(line));
    this.points = interpolateLinearPoints(this.points, 0.01);
    return this;
  }

  deactivate() {
    this.disposables.splice(0).forEach(d => d());
    this.currentPoint = undefined;
  }

  animate(t: number) {
    const v = this.points.length * 0.5;
    const d = v * (t / 1000);
    const index = Math.floor(d) % this.points.length;
    const currentPosition = this.points[index];
    if (currentPosition) {
      if (!this.currentPoint) {
        this.currentPoint = helpers.createArrow(currentPosition);
        this.scene.add(this.currentPoint);
        this.disposables.push(() => this.scene.remove(this.currentPoint));
      } else {
        // console.log(this.currentPoint);
        this.currentPoint.position.copy(currentPosition);
        const next = this.points[(index + 1) % this.points.length];
        this.currentPoint.lookAt(next);
        this.currentPoint.rotateX(Math.PI / 2);
      }
    }
  }
}

function interpolateLinearPoints(points: THREE.Vector3[], step = 0.1) {
  if (!step) {
    throw new Error("Cant be zero");
  }
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    var a = points[i];
    var b = points[i + 1];
    const v = b.clone().sub(a);
    // console.log(i, a, b);
    result.push(a);
    for (let j = step; j <= 1 - step; j += step) {
      const newPoint = a.clone().add(v.clone().multiplyScalar(j));
      // console.log(newPoint);
      result.push(newPoint);
    }
  }
  // console.table(result);
  return result;
}
