import {Vector2} from '@motion-canvas/core/lib/types';

import {Circle, Collider, Polygon} from './colliders';

export type IntersectionResult = CollisionData | undefined;

export interface CollisionData {
  normal: Vector2;
  depth: number;
}

export function intersect(
  colliderA: Collider,
  colliderB: Collider,
): IntersectionResult {
  if (colliderA.type === 'circle') {
    if (colliderB.type === 'circle') {
      return intersectCircles(colliderA, colliderB);
    }
    if (colliderB.type === 'polygon') {
      return intersectCirclePolygon(colliderA, colliderB);
    }
  }

  if (colliderA.type === 'polygon') {
    if (colliderB.type === 'polygon') {
      return intersectPolygons(colliderA, colliderB);
    }
    if (colliderB.type === 'circle') {
      return intersectCirclePolygon(colliderB, colliderA, true);
    }
  }
}

export function intersectCircles(
  circleA: Circle,
  circleB: Circle,
): IntersectionResult {
  const direction = circleA.center.sub(circleB.center);
  const distance = direction.magnitude;
  const radii = circleA.radius + circleB.radius;

  if (distance >= radii) {
    return;
  }

  return {
    normal: direction.normalized,
    depth: radii - distance,
  };
}

export function intersectPolygons(
  polygonA: Polygon,
  polygonB: Polygon,
  flipped = false,
): IntersectionResult {
  let normal = Vector2.zero;
  let depth = Infinity;

  for (const [a, b] of [
    [polygonA, polygonB],
    [polygonB, polygonA],
  ]) {
    for (let i = 0; i < a.vertices.length; i++) {
      const va = a.vertices[i];
      const vb = a.vertices[(i + 1) % a.vertices.length];
      const edge = vb.sub(va);
      const axis = edge.perpendicular.normalized;

      const [minA, maxA] = projectVertices(a.vertices, axis);
      const [minB, maxB] = projectVertices(b.vertices, axis);

      if (minA >= maxB || minB >= maxA) {
        return;
      }

      const axisDepth = Math.min(maxB - minA, maxA - minB);
      if (axisDepth < depth) {
        depth = axisDepth;
        normal = axis;
      }
    }
  }

  const direction = polygonA.center.sub(polygonB.center);

  if (direction.dot(normal) < 0 && !flipped) {
    normal = normal.flipped;
  }

  return {depth, normal};
}

export function intersectCirclePolygon(
  circle: Circle,
  polygon: Polygon,
  flipped = false,
): IntersectionResult {
  let normal = Vector2.zero;
  let depth = Infinity;

  for (let i = 0; i < polygon.vertices.length; i++) {
    const va = polygon.vertices[i];
    const vb = polygon.vertices[(i + 1) % polygon.vertices.length];
    const edge = vb.sub(va);
    const axis = new Vector2(-edge.y, edge.x).normalized;

    const [minA, maxA] = projectVertices(polygon.vertices, axis);
    const [minB, maxB] = projectCircle(circle, axis);

    if (minA >= maxB || minB >= maxA) {
      return;
    }

    const axisDepth = Math.min(maxB - minA, maxA - minB);
    if (axisDepth < depth) {
      depth = axisDepth;
      normal = axis;
    }
  }

  const closestVertex = closestPointOnPolygon(circle.center, polygon);
  const axis = closestVertex.sub(circle.center).normalized;

  const [minA, maxA] = projectVertices(polygon.vertices, axis);
  const [minB, maxB] = projectCircle(circle, axis);

  if (minA >= maxB || minB >= maxA) {
    return;
  }

  const axisDepth = Math.min(maxB - minA, maxA - minB);
  if (axisDepth < depth) {
    depth = axisDepth;
    normal = axis;
  }

  const direction = circle.center.sub(polygon.center);

  if (direction.dot(normal) < 0) {
    normal = normal.flipped;
  }

  if (flipped) {
    normal = normal.flipped;
  }

  return {depth, normal};
}

function projectVertices(vertices: Vector2[], axis: Vector2): [number, number] {
  let min = Infinity;
  let max = -Infinity;

  for (const vertex of vertices) {
    const projection = axis.dot(vertex);
    if (projection < min) {
      min = projection;
    }
    if (projection > max) {
      max = projection;
    }
  }
  return [min, max];
}

function projectCircle(circle: Circle, axis: Vector2): [number, number] {
  const directionAndRadius = axis.scale(circle.radius);

  const p1 = circle.center.add(directionAndRadius);
  const p2 = circle.center.sub(directionAndRadius);

  let min = p1.dot(axis);
  let max = p2.dot(axis);

  if (min > max) {
    [min, max] = [max, min];
  }

  return [min, max];
}

function closestPointOnPolygon(center: Vector2, polygon: Polygon) {
  let result: Vector2 = Vector2.zero;
  let minDistance = Infinity;

  for (const vertex of polygon.vertices) {
    const distance = vertex.sub(center).magnitude;
    if (distance < minDistance) {
      minDistance = distance;
      result = vertex;
    }
  }

  return result;
}
