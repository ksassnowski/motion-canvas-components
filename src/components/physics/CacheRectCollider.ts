import {Shape, ShapeProps} from '@motion-canvas/2d/lib/components';
import {computed, initial, signal} from '@motion-canvas/2d/lib/decorators';
import {SignalValue, SimpleSignal} from '@motion-canvas/core/lib/signals';
import {BBox} from '@motion-canvas/core/lib/types';

import {Polygon} from '../physics/collisions';
import {NodeCollider} from './NodeCollider';

export interface CacheRectColliderProps extends ShapeProps {
  expand?: SignalValue<number>;
}

export class CacheRectCollider extends NodeCollider {
  @initial(0)
  @signal()
  public declare readonly expand: SimpleSignal<number>;

  public constructor(props: CacheRectColliderProps) {
    super(props);
  }

  @computed()
  public shape(): Polygon {
    const body = this.children().at(0) as Shape;
    if (!body) {
      throw new Error('No body provided to collider');
    }

    let rect = body.cacheBBox().expand(this.expand());

    return {
      type: 'polygon',
      vertices: rect.transformCorners(this.localToWorld()),
      center: rect.center.transformAsPoint(this.localToWorld()),
      aabb: BBox.fromPoints(...rect.transformCorners(this.localToWorld())),
    };
  }

  @computed()
  public override localToWorld(): DOMMatrix {
    const parent = this.parent();
    return parent
      ? parent.localToWorld().multiply(this.localToParent())
      : this.localToParent();
  }

  public override localToParent(): DOMMatrix {
    const matrix = new DOMMatrix();
    const offset = this.size().mul(this.offset()).scale(-0.5);
    matrix.translateSelf(this.position.x(), this.position.y());
    matrix.rotateSelf(0, 0, this.rotation());
    matrix.scaleSelf(this.scale.x(), this.scale.y());
    matrix.translateSelf(offset.x, offset.y);

    return matrix;
  }
}
