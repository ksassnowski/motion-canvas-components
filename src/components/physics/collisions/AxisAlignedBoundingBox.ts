import {Vector2} from '@motion-canvas/core/lib/types';

export class AxisAlignedBoundingBox {
  public readonly min: Vector2;
  public readonly max: Vector2;

  public constructor(minX: number, maxX: number, minY: number, maxY: number);
  public constructor(min: Vector2, max: Vector2);
  public constructor(
    one: number | Vector2,
    two: number | Vector2,
    three?: number,
    four?: number,
  ) {
    if (typeof one === 'number') {
      this.min = new Vector2(one, three as number);
      this.max = new Vector2(two as number, four as number);
      return;
    }

    this.min = one;
    this.max = two as Vector2;
  }

  public intersects(other: AxisAlignedBoundingBox): boolean {
    return !(
      this.max.x <= other.min.x ||
      other.max.x <= this.min.x ||
      this.max.y <= other.min.y ||
      other.max.y <= this.min.y
    );
  }
}
