import { BBox, Vector2 } from "@motion-canvas/core/lib/types";

export interface CollisionShape {
  aabb: BBox;
  center: Vector2;
}

export interface Polygon extends CollisionShape {
  type: "polygon";
  vertices: Vector2[];
}

export interface Circle extends CollisionShape {
  type: "circle";
  radius: number;
}

export type Collider = Polygon | Circle;
