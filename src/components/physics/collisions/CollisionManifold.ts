import {Vector2} from '@motion-canvas/core/lib/types';

import {PhysicsBody} from '../PhysicsBody';
import {CollisionData} from './detection';

export class CollisionManifold {
  public constructor(
    public readonly bodyA: PhysicsBody,
    public readonly bodyB: PhysicsBody,
    public readonly collision: CollisionData,
    public readonly contacts: Vector2[],
  ) {}
}
