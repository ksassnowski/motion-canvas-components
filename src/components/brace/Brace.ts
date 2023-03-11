import {Node, Shape, ShapeProps} from '@motion-canvas/2d/lib/components';
import {computed, initial, signal} from '@motion-canvas/2d/lib/decorators';
import {arc, lineTo, moveTo} from '@motion-canvas/2d/lib/utils';
import {drawLine} from '@motion-canvas/2d/src/utils';
import {
  SignalValue,
  SimpleSignal,
  createSignal,
  isReactive,
} from '@motion-canvas/core/lib/signals';
import {ThreadGenerator} from '@motion-canvas/core/lib/threading';
import {
  TimingFunction,
  clamp,
  easeInOutCubic,
  map,
  remap,
  tween,
} from '@motion-canvas/core/lib/tweening';
import {BBox, Direction, Spacing, Vector2} from '@motion-canvas/core/lib/types';

import {BezierCubic2D} from './BezierCubic2D';

export interface BraceProps extends ShapeProps {
  /**
   * {@inheritDoc Brace.nodes}
   */
  nodes?: SignalValue<Node | Node[]>;
  /**
   * {@inheritDoc Brace.sharpness}
   */
  sharpness?: SignalValue<number>;
  /**
   * {@inheritDoc Brace.edge}
   */
  edge?: SignalValue<Direction>;
  /**
   * {@inheritDoc Brace.buffer}
   */
  buffer?: SignalValue<number>;
  /**
   * {@inheritDoc Brace.inset}
   */
  inset?: SignalValue<number>;
  /**
   * {@inheritDoc Brace.start}
   */
  start?: SignalValue<number>;
  /**
   * {@inheritDoc Brace.end}
   */
  end?: SignalValue<number>;
}

export class Brace extends Shape {
  /**
   * The node or nodes that the brace should be drawn adjacent to.
   *
   * @remarks
   * The brace will be drawn adjacent to the bounding box that contains all
   * provided nodes.
   *
   * @defaultValue []
   */
  @initial([])
  @signal()
  public declare readonly nodes: SimpleSignal<Node[] | Node>;

  /**
   * Which edge of the bounding box the brace should be drawn adjacent to.
   *
   * @defaultValue Direction.Bottom
   */
  @initial(Direction.Bottom)
  @signal()
  public declare readonly edge: SimpleSignal<Direction>;

  /**
   * How much buffer to add between the brace and the bounding box when
   * positioning the brace.
   *
   * @defaultValue 0
   */
  @initial(0)
  @signal()
  public declare readonly buffer: SimpleSignal<number>;

  /**
   * How far the brace should be inset from the actual corners of the bounding
   * box.
   *
   * @remarks
   * This property depends on the {@link edge} the brace should be drawn
   * adjacent to.
   * For `Direction.Top` and `Direction.Bottom`, additional
   * horizontal padding will be applied to the start and end points of the
   * brace.
   * For `Direction.Left` and `Direction.Right`, additional vertical padding
   * will be applied to the start and end points of the brace.
   *
   * @defaultValue 0
   */
  @initial(0)
  @signal()
  public declare readonly inset: SimpleSignal<number>;

  /**
   * This property controls how "curvy" the brace should be. Higher values will
   * result in a curvier brace whereas lower values will result in a flatter
   * brace.
   *
   * @remarks
   * This property is especially useful when the brace is rather short.
   *
   * @defaultValue 1
   */
  @initial(1)
  @signal()
  public declare readonly sharpness: SimpleSignal<number>;

  /**
   * The percentage from which to start drawing the brace.
   *
   * @remarks
   * Unlike {@link Line}, this property is not relative to the brace's arc
   * length. It will simply evaluate the curve at the provided value. This means
   * that animating this property won't happen at a constant speed.
   *
   * @defaultValue 0
   */
  @initial(0)
  @signal()
  public declare readonly start: SimpleSignal<number>;

  /**
   * The percentage up to which the brace should be drawn.
   *
   * @remarks
   * Unlike {@link Line}, this property is not relative to the brace's arc
   * length. It will simply evaluate the curve at the provided value. This means
   * that animating this property won't happen at a constant speed.
   *
   * @defaultValue 1
   */
  @initial(1)
  @signal()
  public declare readonly end: SimpleSignal<number>;

  private previousBBox = createSignal(new BBox());
  private progress = createSignal(1);

  constructor(props: BraceProps) {
    super(props);
  }

  public *tweenNodes(
    value: SignalValue<Node | Node[]>,
    duration: number,
    timingFunction: TimingFunction = easeInOutCubic,
  ): ThreadGenerator {
    this.previousBBox(this.targetBBox());
    this.nodes(value);

    yield* tween(duration, value => {
      this.progress(map(0, 1, timingFunction(value)));
    });
  }

  @computed()
  protected override getPath(): Path2D {
    const path = new Path2D();
    let start = this.start();
    let end = this.end();

    if (end < start) {
      [start, end] = [end, start];
    }

    let move = true;

    for (const curve of this.curves()) {
      const relativeStart = clamp(0, 1, start * 2);
      const relativeEnd = remap(0, 1, relativeStart, 1, clamp(0, 1, end * 2));
      const [, startSegment] = curve.split(relativeStart);
      const [segment] = startSegment.split(relativeEnd);

      if (move) {
        moveTo(path, segment.p0);
        move = false;
      }

      path.bezierCurveTo(
        segment.p1.x,
        segment.p1.y,
        segment.p2.x,
        segment.p2.y,
        segment.p3.x,
        segment.p3.y,
      );

      end -= 0.5;
      start -= 0.5;
    }

    return path;
  }

  @computed()
  protected getCacheBBox(): BBox {
    return BBox.fromPoints(...this.controlPoints());
  }

  @computed()
  private parsedNodes(): Node[] {
    const nodes = this.nodes();
    function wrap<T>(value: T | T[]): T[] {
      return Array.isArray(value) ? value : [value];
    }
    return isReactive(nodes) ? wrap(nodes()) : wrap(nodes);
  }

  @computed()
  private targetBBox(): BBox {
    const newBBox = BBox.fromBBoxes(
      ...this.parsedNodes().map(node =>
        node.cacheBBox().transform(node.localToWorld()),
      ),
    ).transform(this.worldToLocal());

    return this.previousBBox().lerp(newBBox, this.progress());
  }

  @computed()
  private controlPoints(): Vector2[] {
    const buffer = this.buffer();
    const direction = this.offsetDirection();
    const edge = this.edge();

    const start = this.startVertex().add(direction.scale(buffer));
    const end = this.endVertex().add(direction.scale(buffer));

    const sharpness = this.sharpness();

    const mid = start.lerp(end, 0.5).add(direction.scale(30 * sharpness));
    const startP1 = start.add(direction.scale(40 * sharpness));
    let startP2 = mid
      .add(direction.flipped.scale(40 * sharpness))
      .add(direction.perpendicular.flipped.scale(18 * sharpness));
    let endP1 = mid
      .add(direction.flipped.scale(40 * sharpness))
      .add(direction.perpendicular.scale(18 * sharpness));
    const endP2 = end.add(direction.scale(40 * sharpness));

    if (edge === Direction.Right || edge === Direction.Top) {
      [startP2, endP1] = [endP1, startP2];
    }

    return [start, startP1, startP2, mid, endP1, endP2, end];
  }

  @computed()
  private curves(): [BezierCubic2D, BezierCubic2D] {
    const points = this.controlPoints();
    return [
      new BezierCubic2D(points[0], points[1], points[2], points[3]),
      new BezierCubic2D(points[3], points[4], points[5], points[6]),
    ];
  }

  @computed()
  private startVertex(): Vector2 {
    const bbox = this.targetBBox();
    const lineWidth = this.lineWidth();
    const inset = this.insetDirection();

    switch (this.edge()) {
      case Direction.Top:
        return bbox.topLeft.add(Vector2.right.scale(lineWidth)).add(inset);
      case Direction.Bottom:
        return bbox.bottomLeft.add(Vector2.right.scale(lineWidth)).add(inset);
      case Direction.Left:
        return bbox.topLeft.add(Vector2.up.scale(lineWidth)).add(inset);
      case Direction.Right:
        return bbox.topRight.add(Vector2.up.scale(lineWidth)).add(inset);
    }
  }

  @computed()
  private endVertex(): Vector2 {
    const bbox = this.targetBBox();
    const lineWidth = this.lineWidth();
    const inset = this.insetDirection();

    switch (this.edge()) {
      case Direction.Top:
        return bbox.topRight.add(Vector2.left.scale(lineWidth)).sub(inset);
      case Direction.Bottom:
        return bbox.bottomRight.add(Vector2.left.scale(lineWidth)).sub(inset);
      case Direction.Left:
        return bbox.bottomLeft.add(Vector2.down.scale(lineWidth)).sub(inset);
      case Direction.Right:
        return bbox.bottomRight.add(Vector2.down.scale(lineWidth)).sub(inset);
    }
  }

  @computed()
  private offsetDirection(): Vector2 {
    switch (this.edge()) {
      case Direction.Top:
        return Vector2.down;
      case Direction.Bottom:
        return Vector2.up;
      case Direction.Left:
        return Vector2.left;
      case Direction.Right:
        return Vector2.right;
    }
  }

  @computed()
  private insetDirection(): Vector2 {
    switch (this.edge()) {
      case Direction.Top:
      case Direction.Bottom:
        return Vector2.right.scale(this.inset());
      case Direction.Left:
      case Direction.Right:
        return Vector2.up.scale(this.inset());
    }
  }

  drawOverlay(context: CanvasRenderingContext2D, matrix: DOMMatrix) {
    const points = this.controlPoints().map(p => p.transformAsPoint(matrix));
    const lineWidth = this.lineWidth();
    let boxSpacing: Spacing;

    switch (this.edge()) {
      case Direction.Top:
      case Direction.Bottom:
        boxSpacing = new Spacing({
          top: 0,
          bottom: 0,
          right: lineWidth / 2,
          left: lineWidth / 2,
        });
        break;
      case Direction.Left:
      case Direction.Right:
        boxSpacing = new Spacing({
          top: lineWidth / 2,
          bottom: lineWidth / 2,
          right: 0,
          left: 0,
        });
        break;
    }

    const box = this.cacheBBox()
      .addSpacing(boxSpacing)
      .transformCorners(matrix);

    context.strokeStyle = 'white';
    context.fillStyle = 'white';
    context.lineWidth = 1;

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    context.bezierCurveTo(
      points[1].x,
      points[1].y,
      points[2].x,
      points[2].y,
      points[3].x,
      points[3].y,
    );
    context.bezierCurveTo(
      points[4].x,
      points[4].y,
      points[5].x,
      points[5].y,
      points[6].x,
      points[6].y,
    );
    context.stroke();

    const radius = 3;
    for (const point of [points[0], points[3], points[6]]) {
      context.beginPath();
      arc(context, point, radius);
      context.fill();
      context.stroke();
    }

    context.fillStyle = 'black';

    for (const [from, to] of [
      [points[0], points[1]],
      [points[3], points[2]],
      [points[3], points[4]],
      [points[6], points[5]],
    ]) {
      context.beginPath();
      moveTo(context, from);
      lineTo(context, to);
      context.fill();
      context.stroke();

      context.beginPath();
      arc(context, to, 3);
      context.fill();
      context.stroke();
    }

    context.fillStyle = 'white';

    context.beginPath();
    drawLine(context, box);
    context.closePath();
    context.stroke();
  }
}
