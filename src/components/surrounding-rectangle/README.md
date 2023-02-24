# Surrounding Rectangle

A component that renders a rectangle around a provided list of components. The
`SurroundingRectangle` automatically calculates its required dimensions based on
the bounding box around the provided components. Also provides an option to
apply a buffer around the edge of the rectangle and the surrounded components.

## Properties

````ts
interface SurroundingRectangleProps extends RectProps {
  /**
   * The nodes the rectangle should surround. The width and height of the
   * resulting rectangle is determined by calculating the bounding box that
   * contains all provided nodes, plus the configured buffer.
   */
  nodes: SignalValue<Layout | Layout[]>;

  /**
   * Factor by which to scale the width of the rectangle. Can be used to
   * animate the rectangle appearing.
   *
   * @example
   * ```ts
   * rect().end(0, 0).to(1, 1);
   */
  end?: SignalValue<number>;

  /**
   * The amount of buffer to apply around rectangle and the surrounded nodes.
   */
  buffer?: SignalValue<PossibleVector2>;
  bufferX?: SignalValue<number>;
  bufferY?: SignalValue<number>;
}
````

## Example

```tsx
import {makeScene2D} from '@motion-canvas/2d';
import {
  Circle,
  CircleProps,
  RectProps,
  Text,
  TextProps,
} from '@motion-canvas/2d/lib/components';
import {waitFor} from '@motion-canvas/core/lib/flow';
import {PossibleColor, PossibleVector2} from '@motion-canvas/core/lib/types';
import {createRef, makeRef} from '@motion-canvas/core/lib/utils';

import {SurroundingRectangle} from '@ksassnowski/motion-canvas-components';

const rectStyles: RectProps = {
  lineWidth: 6,
  stroke: 'bisque',
  smoothCorners: true,
  radius: 16,
};

const circleStyles: CircleProps = {
  size: 120,
  justifyContent: 'center',
  alignItems: 'center',
};

const textStyles: TextProps = {
  fontSize: 48,
  fontFamily: 'monospace',
  fill: 'whitesmoke',
};

export default makeScene2D(function* (view) {
  const rect = createRef<SurroundingRectangle>();
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

      <SurroundingRectangle
        ref={rect}
        nodes={circles[0]}
        buffer={30}
        {...rectStyles}
      />
    </>,
  );

  yield* rect().nodes([circles[0], circles[1]], 1);
  yield* waitFor(0.5);
  yield* rect().nodes(circles[1], 1);
  yield* waitFor(0.5);
  yield* rect().nodes([circles[2], circles[0]], 1);
  yield* waitFor(0.5);
  yield* rect().nodes(circles[2], 1);
  yield* waitFor(0.5);
  yield* rect().nodes([circles[1], circles[2]], 1);
  yield* waitFor(1);
});
```

https://user-images.githubusercontent.com/5139098/221147216-96dad0af-02ce-437d-9ffc-b53cf1b54bf6.mp4
