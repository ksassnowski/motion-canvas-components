# Motion Canvas Components

A collection of components for [Motion Canvas](https://motioncanvas.io) that I
often use in my projects. Feel free to use them in your own projects. While I
try to make the components as generic as possible, be aware that some behaviors
might still be specific to my particular use case.

## Disclaimer

> **Warning** <br> This project is open source but _not_ open for contributions.
> I simply put these components out there because others might benefit from it,
> too. I won't be accepting merge requests or feature requests, however.

Depending on the npm package should be fine as I will try to not introduce
breaking changes in minor versions. Oftentimes, you'll be better off just
copy&pasting whatever you need into your own project, however. This will also
allow you to customize the components to your own needs.

## Installation

You can install the components by running one of the following command in your
terminal:

`npm`

```
npm install --save-dev @ksassnowski/motion-canvas-components
```

`yarn`

```
yarn add --dev @ksassnowski/motion-canvas-components
```

## Components

- [`SurroundingRect`](/src/components/surrounding-rectangle) – A component to
  render a rectangle around a list of provided nodes. Automatically calculates
  its required size based on the provided nodes. Can be animated to move between
  different nodes.
- [`Physics Engine`](/src/components/physics) – A basic 2D physics engine for
  Motion Canvas. Because why the hell not?
