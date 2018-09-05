import * as THREE from "three";
import * as helpers from "./helpers";

export default class Circular {
  points: THREE.Vector3[] = [];
  currentPoint?: THREE.Mesh = undefined;
  disposables = [];
  constructor(private scene: THREE.Scene) {}
  activate() {
    this.points = helpers.createCirclePoints();
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
