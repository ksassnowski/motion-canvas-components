import { Node, Shape, ShapeProps } from "@motion-canvas/2d/lib/components";
import { computed, initial, signal } from "@motion-canvas/2d/lib/decorators";
import { SignalValue, SimpleSignal } from "@motion-canvas/core/lib/signals";
import { BBox, Vector2 } from "@motion-canvas/core/lib/types";
import { useLogger } from "@motion-canvas/core/lib/utils";

import { AxisAlignedBoundingBox, Circle } from "../physics/collisions";
import { NodeCollider } from "./NodeCollider";
import { PhysicsBody } from "./PhysicsBody";

export interface CircleColliderProps extends ShapeProps {
  radius?: SignalValue<number>;
}

export class CircleCollider extends NodeCollider {
  @initial(() => 0)
  @signal()
  public declare readonly radius: SimpleSignal<number>;

  public constructor(props: CircleColliderProps) {
    super(props);
  }

  @computed()
  public shape(): Circle {
    let radius: number;
    if (this.radius.isInitial()) {
      const body = this.body();

      if (!(body instanceof Shape)) {
        useLogger().warn(
          "Cannot infer collision circle radius as child node does not extend Shape.",
        );
        radius = 0;
      } else {
        radius = Math.max(body.width(), body.height()) / 2;
      }
    } else {
      radius = this.radius();
    }

    return {
      type: "circle",
      center: this.position().transformAsPoint(this.localToWorld()),
      radius: radius,
      aabb: this.aabb(),
    };
  }

  @computed()
  public body(): Node {
    return this.children()[0];
  }

  @computed()
  protected aabb(): BBox {
    const absolutePosition = this.absolutePosition();
    const radius = new Vector2(this.radius());
    const subRadius = absolutePosition.sub(radius);
    const plusRadius = absolutePosition.add(radius);

    return BBox.fromPoints(subRadius, plusRadius);
  }
}
