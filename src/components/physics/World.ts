import {Node, NodeProps} from '@motion-canvas/2d/lib/components';
import {
  computed,
  initial,
  signal,
  vector2Signal,
} from '@motion-canvas/2d/lib/decorators';
import {
  SignalValue,
  SimpleSignal,
  createSignal,
} from '@motion-canvas/core/lib/signals';
import {ThreadGenerator} from '@motion-canvas/core/lib/threading';
import {PossibleVector2, Vector2Signal} from '@motion-canvas/core/lib/types';
import {useThread} from '@motion-canvas/core/lib/utils';

import {KinematicBody} from './KinematicBody';
import {PhysicsBody} from './PhysicsBody';
import {StaticBody} from './StaticBody';
import {findContactPoints, intersect} from './collisions';
import {CollisionManifold} from './collisions/CollisionManifold';

export interface WorldProps extends NodeProps {
  gravity?: SignalValue<PossibleVector2>;
  precision?: SignalValue<number>;
}

export class World extends Node {
  @initial({x: 0, y: 9.81})
  @vector2Signal('gravity')
  public declare readonly gravity: Vector2Signal<this>;

  @initial(6)
  @signal()
  public declare readonly precision: SimpleSignal<number>;

  public collisions = createSignal([] as CollisionManifold[]);

  public constructor(props: WorldProps) {
    super(props);
  }

  @computed()
  protected bodies() {
    return this.children().filter(this.isPhysicsBody);
  }

  @computed()
  protected kinematicBodies() {
    return this.bodies().filter(this.isKinematicBody);
  }

  @computed()
  protected scaledGravity() {
    return this.gravity().scale(120);
  }

  public *simulate(duration: number): ThreadGenerator {
    const thread = useThread();
    const startTime = thread.time();

    const simulationFrames = 120;
    const timeStep = 1 / simulationFrames;

    let simulationTime = startTime;

    while (simulationTime - startTime < duration) {
      while (simulationTime < thread.fixed) {
        const dt = thread.fixed - simulationTime;

        if (timeStep > dt) {
          simulationTime = thread.fixed;
        } else {
          simulationTime += timeStep;
        }

        this.handleMovement(dt);
        this.detectCollisions(dt);
        this.resolveCollisions(dt);
      }

      yield;
    }
  }

  private handleMovement(delta: number) {
    const precision = this.precision();
    const realDelta = delta / precision;

    for (let i = 0; i < this.precision(); i++) {
      for (const body of this.kinematicBodies()) {
        body.tick(realDelta, this.scaledGravity());
      }
    }
  }

  private detectCollisions(delta: number) {
    this.collisions([]);
    const detectedCollisions = [];
    const bodies = this.bodies();

    for (let i = 0; i < bodies.length; i++) {
      const bodyA = bodies[i];
      const colliderA = bodyA.collider();

      if (!colliderA) {
        continue;
      }

      for (let j = i + 1; j < bodies.length; j++) {
        const bodyB = bodies[j];
        if (bodyA instanceof StaticBody && bodyB instanceof StaticBody) {
          continue;
        }

        const colliderB = bodyB.collider();
        if (!colliderB) {
          continue;
        }

        if (!colliderA.aabb.intersects(colliderB.aabb)) {
          continue;
        }

        const collision = intersect(colliderA, colliderB);
        if (collision) {
          detectedCollisions.push(
            new CollisionManifold(
              bodyA,
              bodyB,
              collision,
              findContactPoints(colliderA, colliderB),
            ),
          );

          const deltaP = collision.normal.scale(collision.depth).scale(0.5);
          if (bodyA instanceof KinematicBody) {
            bodyA.position(bodyA.position().add(deltaP));
          }
          if (bodyB instanceof KinematicBody) {
            bodyB.position(bodyB.position().sub(deltaP));
          }
        }
      }
    }

    this.collisions(detectedCollisions);
  }

  private resolveCollisions(delta: number) {
    for (const manifold of this.collisions()) {
      const bodyA = manifold.bodyA;
      const bodyB = manifold.bodyB;
      const collision = manifold.collision;

      const relativeVelocity = bodyA
        .linearVelocity()
        .sub(bodyB.linearVelocity());

      if (relativeVelocity.dot(collision.normal) > 0) {
        return;
      }

      const e = Math.min(bodyA.restitution(), bodyB.restitution());
      let j = -(1 + e) * relativeVelocity.dot(collision.normal);
      j /= bodyA.inverseMass() + bodyB.inverseMass();
      const impulse = collision.normal.scale(j);

      if (bodyA instanceof KinematicBody) {
        const deltaV = impulse.scale(bodyA.inverseMass());
        bodyA.linearVelocity(bodyA.linearVelocity().add(deltaV));
      }

      if (bodyB instanceof KinematicBody) {
        const deltaV = impulse.scale(bodyB.inverseMass());
        bodyB.linearVelocity(bodyB.linearVelocity().sub(deltaV));
      }
    }
  }

  private isPhysicsBody(node: Node): node is PhysicsBody {
    return node instanceof PhysicsBody;
  }

  private isKinematicBody(node: PhysicsBody): node is KinematicBody {
    return node instanceof KinematicBody;
  }
}
