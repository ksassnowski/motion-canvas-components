import {Node, NodeProps} from '@motion-canvas/2d/lib/components';
import {
  computed,
  initial,
  signal,
  vector2Signal,
} from '@motion-canvas/2d/lib/decorators';
import {SignalValue, SimpleSignal} from '@motion-canvas/core/lib/signals';
import {
  PossibleVector2,
  Vector2,
  Vector2Signal,
} from '@motion-canvas/core/lib/types';

import {NodeCollider} from './NodeCollider';
import {Collider} from './collisions';

export interface PhysicsBodyProps extends NodeProps {
  restitution?: SignalValue<number>;
  mass?: SignalValue<number>;
  linearVelocity?: SignalValue<PossibleVector2>;
}

export abstract class PhysicsBody extends Node {
  @initial(1)
  @signal()
  public declare readonly restitution: SimpleSignal<number>;

  @initial(0.01)
  @signal()
  public declare readonly mass: SimpleSignal<number>;

  @vector2Signal('linearVelocity')
  public declare readonly linearVelocity: Vector2Signal<number>;

  protected force = Vector2.zero;

  protected constructor(props: PhysicsBodyProps) {
    super(props);
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

  private isCollider(node: Node): node is NodeCollider {
    return node instanceof NodeCollider;
  }
}
