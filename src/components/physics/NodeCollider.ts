import { Shape } from "@motion-canvas/2d/lib/components";

import { Collider } from "../physics/collisions";

export abstract class NodeCollider extends Shape {
  public abstract shape(): Collider;
}
