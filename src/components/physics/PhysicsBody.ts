import {Node, NodeProps} from '@motion-canvas/2d/lib/components';
import {
  computed,
  initial,
  signal,
  vector2Signal,
} from '@motion-canvas/2d/lib/decorators';
import {SignalValue, SimpleSignal} from '@motion-canvas/core/lib/signals';
import {
  BBox,
  PossibleVector2,
  Vector2,
  Vector2Signal,
} from '@motion-canvas/core/lib/types';

import {Collider} from '../physics/collisions';
import {NodeCollider} from './NodeCollider';

export interface PhysicsBodyProps extends NodeProps {
  restitution?: SignalValue<number>;
  mass?: SignalValue<number>;
  linearVelocity?: SignalValue<PossibleVector2>;
  angularVelocity?: SignalValue<number>;
  staticFriction?: SignalValue<number>;
  dynamicFriction?: SignalValue<number>;
  sleeping?: SignalValue<boolean>;
}

export abstract class PhysicsBody extends Node {
  @initial(1)
  @signal()
  public declare readonly restitution: SimpleSignal<number, this>;

  @initial(1)
  @signal()
  public declare readonly mass: SimpleSignal<number, this>;

  @vector2Signal('linearVelocity')
  public declare readonly linearVelocity: Vector2Signal<number>;

  @initial(0)
  @signal()
  public declare readonly angularVelocity: SimpleSignal<number, this>;

  @initial(0.5)
  @signal()
  public declare readonly staticFriction: SimpleSignal<number, this>;

  @initial(0.4)
  @signal()
  public declare readonly dynamicFriction: SimpleSignal<number, this>;

  @initial(true)
  @signal()
  public declare readonly sleeping: SimpleSignal<boolean, this>;

  protected force = Vector2.zero;

  protected constructor(props: PhysicsBodyProps) {
    super(props);
  }

  @computed()
  public rotationalInertia(): number {
    const collider = this.collider();
    if (!collider) {
      return 0;
    }
    switch (collider.type) {
      case 'polygon':
        // @todo We're treating all polygons as rectangles right now
        const bbox = BBox.fromPoints(...collider.vertices);
        return (
          (1 / 12) *
          this.mass() *
          (bbox.width * bbox.width + bbox.height * bbox.height)
        );
      case 'circle':
        return this.mass() * 0.5 * collider.radius * collider.radius;
    }
  }

  @computed()
  public collider(): Collider | undefined {
    const collider = this.children().find(this.isCollider);
    return collider?.shape();
  }

  public applyForce(force: Vector2) {
    return this;
  }

  public abstract inverseMass(): number;

  public abstract inverseRotationalInertia(): number;

  protected getCacheBBox(): BBox {
    return this.collider()!.aabb;
  }

  private isCollider(node: Node): node is NodeCollider {
    return node instanceof NodeCollider;
  }
}
