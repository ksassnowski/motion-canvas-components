import {Layout, Rect, RectProps} from '@motion-canvas/2d/lib/components';
import {
  computed,
  initial,
  signal,
  vector2Signal,
} from '@motion-canvas/2d/lib/decorators';
import {
  SignalValue,
  SimpleSignal,
  createSignal,
  isReactive,
} from '@motion-canvas/core/lib/signals';
import {ThreadGenerator} from '@motion-canvas/core/lib/threading';
import {
  TimingFunction,
  easeInOutCubic,
  map,
  tween,
} from '@motion-canvas/core/lib/tweening';
import {
  BBox,
  Origin,
  PossibleVector2,
  Vector2,
  Vector2Signal,
} from '@motion-canvas/core/lib/types';

import {wrapArray} from '../../utils';

export interface SurroundingRectangleProps extends RectProps {
  nodes: SignalValue<Layout | Layout[]>;
  end?: SignalValue<number>;
  buffer?: SignalValue<PossibleVector2>;
  bufferX?: SignalValue<number>;
  bufferY?: SignalValue<number>;
}

export class SurroundingRectangle extends Rect {
  /**
   * The nodes the rectangle should surround. The width and height of the
   * resulting rectangle is determined by calculating the bounding box that
   * contains all provided nodes, plus the configured buffer.
   */
  @initial([])
  @signal()
  public declare readonly nodes: SimpleSignal<Layout | Layout[]>;

  /**
   * Factor by which to scale the width of the rectangle. Can be used to
   * animate the rectangle appearing.
   *
   * @example
   * ```ts
   * rect().end(0, 0).to(1, 1);
   * ```
   */
  @initial(1)
  @signal()
  public declare readonly end: SimpleSignal<number>;

  /**
   * The amount of buffer to apply around rectangle and the surrounded nodes.
   */
  @initial(new Vector2(15))
  @vector2Signal('buffer')
  public declare readonly buffer: Vector2Signal<this>;

  private previousNodes = createSignal(this.parsedNodes());
  private progress = createSignal(1);

  public constructor(props: SurroundingRectangleProps) {
    super({
      ...props,
      offset: [-1, 0],
      width: () => this.boundingBox().width,
      height: () => this.boundingBox().height,
      position: () =>
        this.boundingBox().position.transformAsPoint(this.worldToParent()),
    });
  }

  @computed()
  public boundingBox(): BBox {
    const oldBoundingBox = this.calculateBoundingBox(this.previousNodes());
    const newBoundingBox = this.calculateBoundingBox(this.parsedNodes());
    return oldBoundingBox.lerp(newBoundingBox, this.progress());
  }

  private *tweenNodes(
    value: SignalValue<Layout[] | Layout>,
    duration: number,
    timingFunction: TimingFunction = easeInOutCubic,
  ): ThreadGenerator {
    this.previousNodes(this.parsedNodes());
    this.nodes(value);

    yield* tween(duration, value => {
      this.progress(map(0, 1, timingFunction(value)));
    });
  }

  @computed()
  private parsedNodes(): Layout[] {
    const nodes = this.nodes();
    return isReactive(nodes) ? wrapArray(nodes()) : wrapArray(nodes);
  }

  private calculateBoundingBox(nodes: Layout[]) {
    if (nodes.length === 0) {
      return new BBox();
    }

    const bottomLefts = nodes.map(node =>
      node
        .getOriginDelta(Origin.BottomLeft)
        .transformAsPoint(node.localToWorld()),
    );
    const topRights = nodes.map(node =>
      node
        .getOriginDelta(Origin.TopRight)
        .transformAsPoint(node.localToWorld()),
    );

    const minX = Math.min(...bottomLefts.map(vec => vec.x));
    const maxX = Math.max(...topRights.map(vec => vec.x));
    const minY = Math.max(...bottomLefts.map(vec => vec.y));
    const maxY = Math.min(...topRights.map(vec => vec.y));

    const parentScale = this.parent()?.absoluteScale() ?? Vector2.one;
    const scaledBuffer = this.buffer()
      .add(new Vector2(this.lineWidth()))
      .mul(parentScale);

    return new BBox(
      map(minX, maxX, 0.5) - (maxX - minX) / 2 - scaledBuffer.x / 2,
      map(minY, maxY, 0.5),

      // I only ever want to animate this horizontally, which is why only
      // the width of the rectangle is scaled by `this.end()`.
      (maxX - minX + scaledBuffer.x) * (1 / parentScale.x) * this.end(),

      // We need to set the height of the rectangle to 0 if `this.end()`
      // is 0. Otherwise, the rectangle would still show as a vertical
      // line with width of `this.lineWidth()`.
      this.end() > 0 ? (minY - maxY + scaledBuffer.y) * (1 / parentScale.y) : 0,
    );
  }
}
