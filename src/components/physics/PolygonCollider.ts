import { ShapeProps } from "@motion-canvas/2d/lib/components";
import { computed, initial, signal } from "@motion-canvas/2d/lib/decorators";
import {
  SignalValue,
  SimpleSignal,
  isReactive,
} from "@motion-canvas/core/lib/signals";
import { BBox, PossibleVector2, Vector2 } from "@motion-canvas/core/lib/types";
import { debug } from "@motion-canvas/core/lib/utils";

import { AxisAlignedBoundingBox, Polygon } from "../physics/collisions";
import { NodeCollider } from "./NodeCollider";

export interface PolygonColliderProps extends ShapeProps {
  vertices: SignalValue<PossibleVector2[]>;
}

export class PolygonCollider extends NodeCollider {
  @initial([])
  @signal()
  public declare readonly vertices: SimpleSignal<Vector2[]>;

  constructor(props: PolygonColliderProps) {
    super(props);
  }

  @computed()
  public shape(): Polygon {
    return {
      type: "polygon",
      vertices: this.parsedVertices(),
      center: this.absolutePosition(),
      aabb: BBox.fromPoints(...this.parsedVertices()),
    };
  }

  @computed()
  protected parsedVertices() {
    return this.vertices().map((vertex) =>
      new Vector2(isReactive(vertex) ? vertex() : vertex).transformAsPoint(
        this.localToWorld(),
      ),
    );
  }
}
