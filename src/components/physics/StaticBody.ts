import { computed } from "@motion-canvas/2d/lib/decorators";

import { PhysicsBody } from "./PhysicsBody";

export class StaticBody extends PhysicsBody {
  @computed()
  public inverseMass(): number {
    return 0;
  }

  @computed()
  public inverseRotationalInertia(): number {
    return 0;
  }
}
