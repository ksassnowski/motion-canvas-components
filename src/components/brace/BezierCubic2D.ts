import {CurvePoint} from '@motion-canvas/2d/lib/curves';
import {Vector2} from '@motion-canvas/core/lib/types';

import {Polynomial2D} from './Polynomial2D';

export class BezierCubic2D {
  private splitDepth: number = 0;

  public constructor(
    public readonly p0: Vector2,
    public readonly p1: Vector2,
    public readonly p2: Vector2,
    public readonly p3: Vector2,
  ) {}

  public arcLength(): number {
    const splitDepthLimit = 20;
    const pathSegmentLengthTolerance = 1e-4;
    const curveScaleForTolerance = this.magnitude();

    if (curveScaleForTolerance < pathSegmentLengthTolerance) {
      return 0;
    }

    let curve: BezierCubic2D = this;
    const curveStack: BezierCubic2D[] = [this];

    let totalLength = 0;
    do {
      const length = curve.approximateDistance();
      const lengthDiscrepancy = length - curve.p0.sub(curve.p3).magnitude;

      if (
        lengthDiscrepancy / curveScaleForTolerance >
          pathSegmentLengthTolerance &&
        curve.splitDepth < splitDepthLimit
      ) {
        const [left, right] = curve.split();
        curve = left;
        curveStack.push(right);
      } else {
        totalLength += length;
        curve = curveStack.pop()!;
      }
    } while (curveStack.length > 0);

    return totalLength;
  }

  public get curve(): Polynomial2D {
    return new Polynomial2D(
      this.p0,
      // 3*(-p0+p1)
      this.p0.flipped.add(this.p1).scale(3),
      // 3*p0-6*p1+3*p2
      this.p0.scale(3).sub(this.p1.scale(6)).add(this.p2.scale(3)),
      // -p0+3*p1-3*p2+p3
      this.p0.flipped.add(this.p1.scale(3)).sub(this.p2.scale(3)).add(this.p3),
    );
  }

  public eval(t: number): CurvePoint {
    return {
      position: this.curve.eval(t),
      tangent: this.curve.evalDerivative(t).normalized,
    };
  }

  public split(t: number = 0.5): [BezierCubic2D, BezierCubic2D] {
    const a = new Vector2(
      this.p0.x + (this.p1.x - this.p0.x) * t,
      this.p0.y + (this.p1.y - this.p0.y) * t,
    );
    const b = new Vector2(
      this.p1.x + (this.p2.x - this.p1.x) * t,
      this.p1.y + (this.p2.y - this.p1.y) * t,
    );
    const c = new Vector2(
      this.p2.x + (this.p3.x - this.p2.x) * t,
      this.p2.y + (this.p3.y - this.p2.y) * t,
    );
    const d = new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    const e = new Vector2(b.x + (c.x - b.x) * t, b.y + (c.y - b.y) * t);
    const p = new Vector2(d.x + (e.x - d.x) * t, d.y + (e.y - d.y) * t);

    const left = new BezierCubic2D(this.p0, a, d, p);
    const right = new BezierCubic2D(p, e, c, this.p3);
    left.splitDepth = right.splitDepth = this.splitDepth + 1;

    return [left, right];
  }

  private approximateDistance(): number {
    return (
      this.p1.sub(this.p0).magnitude +
      this.p2.sub(this.p1).magnitude +
      this.p3.sub(this.p2).magnitude
    );
  }

  private magnitude(): number {
    return (
      (this.p0.magnitude +
        this.p1.magnitude +
        this.p2.magnitude +
        this.p3.magnitude) /
      4
    );
  }
}
