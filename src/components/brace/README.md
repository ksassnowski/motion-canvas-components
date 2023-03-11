# Brace Component

A component to draw a brace next to a node or list of nodes.

## Properties

```ts
export interface BraceProps extends ShapeProps {
  /**
   * The node or nodes that the brace should be drawn adjacent to.
   *
   * @remarks
   * The brace will be drawn adjacent to the bounding box that contains all
   * provided nodes.
   *
   * @defaultValue []
   */
  nodes?: SignalValue<Node | Node[]>;

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
  sharpness?: SignalValue<number>;

  /**
   * Which edge of the bounding box the brace should be drawn adjacent to.
   *
   * @defaultValue Direction.Bottom
   */
  edge?: SignalValue<Direction>;

  /**
   * Which edge of the bounding box the brace should be drawn adjacent to.
   *
   * @defaultValue Direction.Bottom
   */
  buffer?: SignalValue<number>;

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
  inset?: SignalValue<number>;

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
  start?: SignalValue<number>;

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
  end?: SignalValue<number>;
}
```

## Example

```tsx
import { Brace } from "@ksassnowski/motion-canvas-components";

import { makeScene2D } from "@motion-canvas/2d";
import {
  Circle,
  CircleProps,
  Txt,
  TxtProps,
} from "@motion-canvas/2d/lib/components";
import { all, waitFor } from "@motion-canvas/core/lib/flow";
import {
  Direction,
  PossibleColor,
  PossibleVector2,
} from "@motion-canvas/core/lib/types";
import { createRef, makeRef } from "@motion-canvas/core/lib/utils";

const circleStyles: CircleProps = {
  size: 120,
  justifyContent: "center",
  alignItems: "center",
};

export default makeScene2D(function* (view) {
  const brace = createRef<Brace>();
  const circles: Circle[] = [];

  const textProps: TxtProps = {
    fontSize: 48,
    fontFamily: "monospace",
    fill: "whitesmoke",
  };

  const circleProps: { fill: PossibleColor; position: PossibleVector2 }[] = [
    { fill: "slategray", position: [-200, -200] },
    { fill: "maroon", position: [200, 100] },
    { fill: "lightseagreen", position: [-75, -0] },
  ];

  view.add(
    <>
      {circleProps.map((props, i) => (
        <Circle ref={makeRef(circles, i)} {...props} {...circleStyles}>
          <Txt text={i.toString()} {...textProps} />
        </Circle>
      ))}

      <Brace
        ref={brace}
        nodes={circles[0]}
        edge={Direction.Right}
        lineWidth={5}
        stroke={"bisque"}
        start={0.5}
        end={0.5}
        sharpness={0.9}
        buffer={12}
      />
    </>,
  );

  yield* all(brace().start(0, 1), brace().end(1, 1));
  yield* brace().nodes([circles[0], circles[1]], 1);
  yield* waitFor(0.5);
  yield* brace().sharpness(2.5, 1).to(0.7, 1).to(1, 1);
  yield* brace().inset(100, 1).to(0, 1);
  yield* brace().buffer(100, 1).to(0, 1).to(12, 1);
  yield* waitFor(0.5);
  yield* brace().nodes(circles[1], 1);
  yield* waitFor(0.5);
  yield* all(brace().start(0.5, 0.8), brace().end(0.5, 0.8));
  brace().edge(Direction.Bottom);
  yield* waitFor(0.5);
  yield* all(brace().start(0, 0.8), brace().end(1, 0.8));
  yield* brace().nodes([circles[0], circles[2]], 1);
  yield* waitFor(0.5);
  yield* brace().nodes([circles[0], circles[1]], 1);
  yield* waitFor(0.5);
  yield* all(brace().start(0.5, 0.8), brace().end(0.5, 0.8));
  yield* waitFor(1);
});
```

https://user-images.githubusercontent.com/5139098/224476993-4a5bcf0c-b007-4024-b169-612813fa781b.mp4
