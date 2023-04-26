import {Node, NodeProps} from '@motion-canvas/2d/lib/components';
import {
  computed,
  initial,
  signal,
  vector2Signal,
} from '@motion-canvas/2d/lib/decorators';
import {SignalValue, SimpleSignal} from '@motion-canvas/core/lib/signals';
import {ThreadGenerator} from '@motion-canvas/core/lib/threading';
import {
  PossibleVector2,
  Vector2,
  Vector2Signal,
} from '@motion-canvas/core/lib/types';
import {useThread} from '@motion-canvas/core/lib/utils';

import {KinematicBody} from './KinematicBody';
import {PhysicsBody} from './PhysicsBody';
import {StaticBody} from './StaticBody';
import {CollisionData, findContactPoints, intersect} from './collisions';
import {CollisionManifold} from './collisions/CollisionManifold';

export type ContactPair = [PhysicsBody, PhysicsBody];

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
  public declare readonly precision: SimpleSignal<number, this>;

  private contactPairs: ContactPair[] = [];
  private jList: Float32Array = new Float32Array(2);
  private impulses: Vector2[] = new Array(2);
  private frictionImpulses: Vector2[] = new Array(2);
  private raList: Vector2[] = new Array(2);
  private rbList: Vector2[] = new Array(2);

  public constructor(props: WorldProps) {
    super(props);
  }

  @computed()
  protected scaledGravity(): Vector2 {
    return this.gravity().scale(100);
  }

  @computed()
  protected bodies() {
    return this.children().filter(this.isPhysicsBody);
  }

  @computed()
  protected kinematicBodies() {
    return this.bodies().filter(this.isKinematicBody);
  }

  public *simulate(duration: number): ThreadGenerator {
    const thread = useThread();
    const startTime = thread.time();

    const simulationFrames = 600;
    const timeStep = 1 / simulationFrames;

    let simulationTime = startTime;

    while (simulationTime - startTime < duration) {
      while (simulationTime < thread.fixed) {
        const dt = thread.fixed - simulationTime;

        if (timeStep > dt) {
          this.tick(dt);
          simulationTime = thread.fixed;
        } else {
          this.tick(timeStep);
          simulationTime += timeStep;
        }
      }
      yield;
    }
  }

  private tick(delta: number) {
    this.tickBodies(delta);
    this.broadPhase();
    this.narrowPhase();
  }

  private tickBodies(delta: number) {
    for (const body of this.kinematicBodies()) {
      body.tick(delta, this.scaledGravity());

      const position = body.absolutePosition();
      // Remove children that are out of bounds
      if (Math.abs(position.x) > 2050 || Math.abs(position.y) > 1150) {
        body.remove();
      }
    }
  }

  private broadPhase(): void {
    this.contactPairs = [];
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

        if (bodyA.sleeping() && bodyB.sleeping()) {
          continue;
        }

        const colliderB = bodyB.collider();
        if (!colliderB) {
          continue;
        }

        if (!colliderA.aabb.intersects(colliderB.aabb)) {
          continue;
        }

        this.contactPairs.push([bodyA, bodyB]);
      }
    }
  }

  private narrowPhase(): void {
    for (const [bodyA, bodyB] of this.contactPairs) {
      const colliderA = bodyA.collider()!;
      const colliderB = bodyB.collider()!;

      const collision = intersect(colliderA, colliderB);

      if (!collision) {
        continue;
      }

      if (bodyA instanceof KinematicBody) {
        bodyA.sleeping(false);
      }

      if (bodyB instanceof KinematicBody) {
        bodyB.sleeping(false);
      }

      const contactPoints = findContactPoints(colliderA, colliderB);
      const contact = new CollisionManifold(
        bodyA,
        bodyB,
        collision,
        contactPoints,
      );

      this.separateBodies(bodyA, bodyB, collision);
      this.resolveCollision(contact);
    }
  }

  private resolveCollision(contact: CollisionManifold): void {
    const bodyA = contact.bodyA;
    const colliderA = bodyA.collider()!;
    const bodyB = contact.bodyB;
    const colliderB = bodyB.collider()!;
    const normal = contact.collision.normal;
    const contacts = contact.contacts;
    const contactCount = contacts.length;

    const e = Math.min(bodyA.restitution(), bodyB.restitution());
    const sf = bodyA.staticFriction() + bodyB.staticFriction() * 0.5;
    const df = bodyA.dynamicFriction() + bodyB.dynamicFriction() * 0.5;

    for (let i = 0; i < 2; i++) {
      this.jList[i] = 0;
      this.impulses[i] = Vector2.zero;
      this.frictionImpulses[i] = Vector2.zero;
      this.raList[i] = Vector2.zero;
      this.rbList[i] = Vector2.zero;
    }

    for (let i = 0; i < contacts.length; i++) {
      const contactPoint = contacts[i];
      const ra = contactPoint.sub(colliderA.center);
      const rb = contactPoint.sub(colliderB.center);
      const raPerpendicular = ra.perpendicular;
      const rbPerpendicular = rb.perpendicular;
      this.raList[i] = ra;
      this.rbList[i] = rb;

      // The formula assumes that the angular velocity of a body is positive
      // when rotating counter-clockwise. Our angular velocity works the
      // opposite way, however. That's why we have to make sure to scale the
      // perpendicular vector by the negative angular velocity instead.
      const angularLinearVelocityA = raPerpendicular.mul(
        -bodyA.angularVelocity(),
      );
      const angularLinearVelocityB = rbPerpendicular.mul(
        -bodyB.angularVelocity(),
      );

      const totalVelocityA = bodyA.linearVelocity().add(angularLinearVelocityA);
      const totalVelocityB = bodyB.linearVelocity().add(angularLinearVelocityB);
      const relativeVelocity = totalVelocityA.sub(totalVelocityB);
      if (this.approximatelyEquals(relativeVelocity, Vector2.zero, 0.01)) {
        continue;
      }

      const contactVelocityMagnitude = relativeVelocity.dot(normal);
      if (contactVelocityMagnitude > 0) {
        continue;
      }

      const raPerpendicularDotNormal = raPerpendicular.dot(normal);
      const rbPerpendicularDotNormal = rbPerpendicular.dot(normal);
      const denominator =
        bodyA.inverseMass() +
        bodyB.inverseMass() +
        raPerpendicularDotNormal *
          raPerpendicularDotNormal *
          bodyA.inverseRotationalInertia() +
        rbPerpendicularDotNormal *
          rbPerpendicularDotNormal *
          bodyB.inverseRotationalInertia();

      let j = -(1 + e) * contactVelocityMagnitude;
      j /= denominator;
      j /= contacts.length;

      this.impulses[i] = normal.mul(j);
      this.jList[i] = j;
    }

    for (let i = 0; i < this.impulses.length; i++) {
      this.applyImpulse(
        this.impulses[i],
        bodyA,
        this.raList[i],
        bodyB,
        this.rbList[i],
      );
    }

    // Apply friction
    for (let i = 0; i < contactCount; i++) {
      const raPerpendicular = this.raList[i].perpendicular;
      const rbPerpendicular = this.rbList[i].perpendicular;
      const angularLinearVelocityA = raPerpendicular.mul(
        -bodyA.angularVelocity(),
      );
      const angularLinearVelocityB = rbPerpendicular.mul(
        -bodyB.angularVelocity(),
      );

      const totalVelocityA = bodyA.linearVelocity().add(angularLinearVelocityA);
      const totalVelocityB = bodyB.linearVelocity().add(angularLinearVelocityB);

      const relativeVelocity = totalVelocityA.sub(totalVelocityB);
      if (this.approximatelyEquals(relativeVelocity, Vector2.zero, 0.01)) {
        continue;
      }

      const tangent = relativeVelocity.sub(
        normal.scale(relativeVelocity.dot(normal)),
      );

      if (this.approximatelyEquals(tangent, Vector2.zero)) {
        continue;
      }

      const normalizedTangent = tangent.normalized;

      const raPerpendicularDotNormal = raPerpendicular.dot(normalizedTangent);
      const rbPerpendicularDotNormal = rbPerpendicular.dot(normalizedTangent);
      const denominator =
        bodyA.inverseMass() +
        bodyB.inverseMass() +
        raPerpendicularDotNormal *
          raPerpendicularDotNormal *
          bodyA.inverseRotationalInertia() +
        rbPerpendicularDotNormal *
          rbPerpendicularDotNormal *
          bodyB.inverseRotationalInertia();

      let jt = -relativeVelocity.dot(normalizedTangent);
      jt /= denominator;
      jt /= contacts.length;

      const j = this.jList[i];
      let impulse: Vector2;

      // Coulomb's Law
      if (Math.abs(jt) <= j * sf) {
        impulse = normalizedTangent.mul(jt);
      } else {
        impulse = normalizedTangent.mul(-j * df);
      }

      this.frictionImpulses[i] = impulse;
    }

    for (let i = 0; i < this.frictionImpulses.length; i++) {
      this.applyImpulse(
        this.frictionImpulses[i],
        bodyA,
        this.raList[i],
        bodyB,
        this.rbList[i],
      );
    }
  }

  @computed()
  public override localToWorld(): DOMMatrix {
    return new DOMMatrix();
  }

  private separateBodies(
    bodyA: PhysicsBody,
    bodyB: PhysicsBody,
    collision: CollisionData,
  ): void {
    const deltaP = collision.normal.scale(collision.depth).scale(0.5);
    if (bodyA instanceof KinematicBody) {
      bodyA.position(bodyA.position().add(deltaP));
    }
    if (bodyB instanceof KinematicBody) {
      bodyB.position(bodyB.position().sub(deltaP));
    }
  }

  private applyImpulse(
    impulse: Vector2,
    bodyA: PhysicsBody,
    ra: Vector2,
    bodyB: PhysicsBody,
    rb: Vector2,
  ): void {
    if (bodyA instanceof KinematicBody) {
      const linearVelocityDelta = impulse.mul(bodyA.inverseMass());
      const angularVelocityDelta =
        this.crossVectors(ra, impulse) * bodyA.inverseRotationalInertia();
      bodyA.linearVelocity(bodyA.linearVelocity().add(linearVelocityDelta));
      bodyA.angularVelocity(bodyA.angularVelocity() + angularVelocityDelta);
    }

    if (bodyB instanceof KinematicBody) {
      const linearVelocityDelta = impulse.flipped.mul(bodyB.inverseMass());
      const angularVelocityDelta =
        -this.crossVectors(rb, impulse) * bodyB.inverseRotationalInertia();
      bodyB.linearVelocity(bodyB.linearVelocity().add(linearVelocityDelta));
      bodyB.angularVelocity(bodyB.angularVelocity() + angularVelocityDelta);
    }
  }

  private crossVectors(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  }

  private approximatelyEquals(a: Vector2, b: Vector2, epsilon = 0.0001) {
    return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon;
  }

  private isPhysicsBody(node: Node): node is PhysicsBody {
    return node instanceof PhysicsBody;
  }

  private isKinematicBody(node: PhysicsBody): node is KinematicBody {
    return node instanceof KinematicBody;
  }
}
