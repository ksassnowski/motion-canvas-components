import {Vector2} from '@motion-canvas/core/lib/types';

import {Circle, Collider, Polygon} from './colliders';
import {pointSegmentDistance} from './pointSegmentDistance';

export function findContactPoints(
  colliderA: Collider,
  colliderB: Collider,
): Vector2[] {
  if (colliderA.type === 'circle') {
    if (colliderB.type === 'circle') {
      return [findCirclesContactPoint(colliderA, colliderB)];
    }

    if (colliderB.type === 'polygon') {
      return [findCirclePolygonContactPoint(colliderA, colliderB)];
    }
  }

  if (colliderA.type === 'polygon') {
    if (colliderB.type === 'circle') {
      return [findCirclePolygonContactPoint(colliderB, colliderA)];
    }

    if (colliderB.type === 'polygon') {
      return findPolygonsContactPoints(colliderA, colliderB);
    }
  }

  return [];
}

function findCirclesContactPoint(circleA: Circle, circleB: Circle): Vector2 {
  const direction = circleB.center.sub(circleA.center).normalized;
  return circleA.center.add(direction.scale(circleA.radius));
}

function findCirclePolygonContactPoint(
  circle: Circle,
  polygon: Polygon,
): Vector2 {
  let point: Vector2 = Vector2.zero;
  let closestDistanceSquared = Infinity;

  for (let i = 0; i < polygon.vertices.length; i++) {
    const a = polygon.vertices[i];
    const b = polygon.vertices[(i + i) % polygon.vertices.length];

    const {closestPoint, distanceSquared} = pointSegmentDistance(
      circle.center,
      a,
      b,
    );

    if (distanceSquared < closestDistanceSquared) {
      point = closestPoint;
      closestDistanceSquared = distanceSquared;
    }
  }

  return point;
}

function findPolygonsContactPoints(
  polygonA: Polygon,
  polygonB: Polygon,
): Vector2[] {
  let contact1: Vector2 = Vector2.zero;
  let contact2: Vector2 | null = Vector2.zero;

  let minDistanceSquared = Infinity;

  for (const [a, b] of [
    [polygonA, polygonB],
    [polygonB, polygonA],
  ]) {
    for (const p of a.vertices) {
      for (let j = 0; j < b.vertices.length; j++) {
        const va = b.vertices[j];
        const vb = b.vertices[(j + 1) % b.vertices.length];

        const {closestPoint, distanceSquared} = pointSegmentDistance(p, va, vb);
        if (approximatelyEquals(distanceSquared, minDistanceSquared)) {
          if (!approximatelyEquals(closestPoint, contact1)) {
            contact2 = closestPoint;
          }
        } else if (distanceSquared < minDistanceSquared) {
          minDistanceSquared = distanceSquared;
          contact1 = closestPoint;
          contact2 = null;
        }
      }
    }
  }

  if (contact2) {
    return [contact1, contact2];
  }

  return [contact1];
}

function approximatelyEquals(a: number, b: number, epsilon?: number): boolean;
function approximatelyEquals(a: Vector2, b: Vector2, epsilon?: number): boolean;
function approximatelyEquals(
  one: Vector2 | number,
  two: Vector2 | number,
  epsilon = 0.01,
): boolean {
  if (one instanceof Vector2 && two instanceof Vector2) {
    return (
      Math.abs(one.x - two.x) <= epsilon && Math.abs(one.y - two.y) <= epsilon
    );
  }
  return Math.abs((one as number) - (two as number)) <= epsilon;
}
