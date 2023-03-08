import {PhysicsBody} from './PhysicsBody';

export class StaticBody extends PhysicsBody {
  inverseMass(): number {
    return 0;
  }
}
