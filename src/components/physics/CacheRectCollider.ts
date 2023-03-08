import {Shape, ShapeProps} from '@motion-canvas/2d/lib/components';
import {computed, initial, signal} from '@motion-canvas/2d/lib/decorators';
import {SignalValue, SimpleSignal} from '@motion-canvas/core/lib/signals';
import {BBox} from '@motion-canvas/core/lib/types';

import {NodeCollider} from './NodeCollider';
import {Polygon} from './collisions';

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
    if (body.lineWidth() > 0) {
      // I think this should technically be lineWidth / 2 but that doesn't seem
      // to work properly.
      rect = rect.expand(-body.lineWidth());
    }

    return {
      type: 'polygon',
      vertices: rect.transformCorners(this.localToWorld()),
      center: body.cacheBBox().center.transformAsPoint(this.localToWorld()),
      aabb: this.aabb(),
    };
  }

  @computed()
  protected aabb(): BBox {
    return this.children().at(0)!.cacheBBox().transform(this.localToWorld());
  }
}
