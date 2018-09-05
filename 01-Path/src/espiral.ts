import * as THREE from "three";
import * as helpers from "./helpers";

export default class Espiral {
  points: THREE.Vector3[] = [];
  currentPoint?: THREE.Mesh = undefined;
  disposables = [];
  constructor(private scene: THREE.Scene) {}

  activate() {
    this.points = this.createCirclePoints();

    const line = helpers.createLineBetweenPoints(this.points);
    this.scene.add(line);
    this.disposables.push(() => this.scene.remove(line));

    return this;
  }

  deactivate() {
    this.disposables.splice(0).forEach(d => d());
    this.currentPoint = undefined;
  }

  animate(t: number) {
    const v = this.points.length * 0.1;
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

  private createCirclePoints(r = 30) {
    const slice = (2 * Math.PI * 10) / 1000;
    let t = 0.0;
    let rstep = r / 1000;
    let cr = r;
    const circle: THREE.Vector3[] = [];
    while (t < 2 * Math.PI * 10) {
      circle.push(new THREE.Vector3(cr * Math.cos(t), cr * Math.sin(t), 0.0));
      cr -= rstep;
      t += slice;
    }
    return circle;
  }
}
