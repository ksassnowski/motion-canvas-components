import { computed } from "@motion-canvas/2d/lib/decorators";
import { Vector2 } from "@motion-canvas/core/lib/types";

import { PhysicsBody, PhysicsBodyProps } from "./PhysicsBody";

export interface KinematicBodyProps extends PhysicsBodyProps {}

const DEGREES = 180 / Math.PI;

export class KinematicBody extends PhysicsBody {
  @computed()
  public inverseMass(): number {
    return 1 / this.mass();
  }

  @computed()
  public inverseRotationalInertia(): number {
    return 1 / this.rotationalInertia();
  }

  @computed()
  public squaredLinearVelocity(): number {
    const v = this.linearVelocity();
    return v.x * v.x + v.y * v.y;
  }

  @computed()
  public isAtRest(): boolean {
    return this.squaredLinearVelocity() < 300 && this.angularVelocity() < 0.01;
  }

  public constructor(props: KinematicBodyProps) {
    super(props);
    this.sleeping(this.isAtRest());
  }

  public applyForce(force: Vector2) {
    this.force = this.force.add(force);
    this.sleeping(false);
    return this;
  }

  public tick(dt: number, gravity: Vector2) {
    if (this.sleeping()) {
      return;
    }

    this.applyForce(gravity.mul(this.mass()));
    const acceleration = this.force.div(new Vector2(this.mass()));
    const deltaPosition = this.linearVelocity()
      .add(acceleration.mul(dt * 0.5))
      .scale(dt);

    this.position(this.position().add(deltaPosition));
    this.linearVelocity(this.linearVelocity().add(acceleration.scale(dt)));
    this.rotation(this.rotation() + this.angularVelocity() * dt * DEGREES);

    this.force = Vector2.zero;
    this.sleeping(this.isAtRest());
  }
}
