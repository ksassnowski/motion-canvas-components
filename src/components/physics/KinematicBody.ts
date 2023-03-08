import {computed, initial, signal} from '@motion-canvas/2d/lib/decorators';
import {SignalValue, SimpleSignal} from '@motion-canvas/core/lib/signals';
import {Vector2} from '@motion-canvas/core/lib/types';

import {PhysicsBody, PhysicsBodyProps} from './PhysicsBody';

export interface KinematicBodyProps extends PhysicsBodyProps {
  friction?: SignalValue<number>;
}

export class KinematicBody extends PhysicsBody {
  @initial(0)
  @signal()
  public declare readonly friction: SimpleSignal<number>;

  @computed()
  public inverseMass(): number {
    return 1 / this.mass();
  }

  public constructor(props: KinematicBodyProps) {
    super(props);
  }

  public applyForce(force: Vector2) {
    this.force = force.scale(120);
    return this;
  }

  public tick(dt: number, gravity: Vector2) {
    const acceleration = this.force.div(new Vector2(this.mass()));
    this.linearVelocity(this.linearVelocity().add(acceleration.scale(dt)));
    this.position(this.position().add(this.linearVelocity().scale(dt)));

    this.applyFriction(dt);
    this.force = Vector2.zero;
  }

  private applyFriction(dt: number) {
    const velocity = this.linearVelocity();
    if (velocity.magnitude < 0.01) {
      return;
    }
    // Something something, friction proportional to mass
    this.linearVelocity(
      velocity.sub(velocity.normalized.scale(this.friction() * dt)),
    );
  }
}
