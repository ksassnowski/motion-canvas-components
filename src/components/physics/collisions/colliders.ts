import {BBox, Vector2} from '@motion-canvas/core/lib/types';

export interface CollisionShape {
  aabb: BBox;
}

export interface Polygon extends CollisionShape {
  type: 'polygon';
  vertices: Vector2[];
  center: Vector2;
}

export interface Circle extends CollisionShape {
  type: 'circle';
  center: Vector2;
  radius: number;
}

export interface Line extends CollisionShape {
  type: 'line';
  points: Vector2[];
  lineWidth: number;
}

export type Collider = Polygon | Circle;
