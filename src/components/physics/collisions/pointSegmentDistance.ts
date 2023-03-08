import {Vector2} from '@motion-canvas/core/lib/types';

export interface PointSegmentDistance {
  closestPoint: Vector2;
  distanceSquared: number;
}

export function pointSegmentDistance(
  p: Vector2,
  a: Vector2,
  b: Vector2,
): PointSegmentDistance {
  const ab = b.sub(a);
  const ap = p.sub(a);

  const projection = ap.dot(ab);
  const abSquaredMagnitude = ab.x * ab.x + ab.y * ab.y;
  const distance = projection / abSquaredMagnitude;

  let closestPoint: Vector2;
  if (distance <= 0) {
    closestPoint = a;
  } else if (distance >= 1) {
    closestPoint = b;
  } else {
    closestPoint = a.add(ab.scale(distance));
  }

  const contactPointP = p.sub(closestPoint);
  const distanceSquared =
    contactPointP.x * contactPointP.x + contactPointP.y * contactPointP.y;

  return {closestPoint, distanceSquared};
}
