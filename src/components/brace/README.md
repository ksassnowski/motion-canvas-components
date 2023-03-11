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
import {makeScene2D} from '@motion-canvas/2d';
import {Circle, CircleProps} from '@motion-canvas/2d/lib/components';
import {all, waitFor} from '@motion-canvas/core/lib/flow';
import {
  Direction,
  PossibleColor,
  PossibleVector2,
} from '@motion-canvas/core/lib/types';
import {createRef, makeRef} from '@motion-canvas/core/lib/utils';

import {Brace} from '@ksassnowski/motion-canvas-components';

const circleStyles: CircleProps = {
  size: 120,
  justifyContent: 'center',
  alignItems: 'center',
};

export default makeScene2D(function* (view) {
  const brace = createRef<Brace>();
  const circles: Circle[] = [];

  const circleProps: {fill: PossibleColor; position: PossibleVector2}[] = [
    {fill: 'slategray', position: [-200, -200]},
    {fill: 'maroon', position: [200, 100]},
    {fill: 'lightseagreen', position: [-75, -0]},
  ];

  view.add(
    <>
      {circleProps.map((props, i) => (
        <Circle ref={makeRef(circles, i)} {...props} {...circleStyles}>
          <Text text={i.toString()} {...textStyles} />
        </Circle>
      ))}

      <Brace
        ref={brace}
        nodes={circles[0]}
        edge={Direction.Right}
        lineWidth={4}
        stroke={'bisque'}
        start={0.5}
        end={0.5}
        buffer={8}
      />
    </>,
  );

  yield* all(brace().start(0, 1), brace().end(1, 1));
  yield* brace().nodes([circles[0], circles[1]], 1);
  yield* waitFor(0.5);
  yield* brace().sharpness(2, 1).to(0.5, 1).to(1, 1);
  yield* brace().nodes(circles[1], 1);
  yield* waitFor(0.5);
  yield* brace().inset(10, 1).to(0, 1);
  yield* waitFor(1);
});
```
