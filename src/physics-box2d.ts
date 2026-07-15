import Box2DFactory from 'box2d-wasm';
import type { StageDef } from './data/maps';
import type { IPhysics, MarbleCollisionPair, MarblePhysicsProfile } from './IPhysics';
import type { MapEntity, MapEntityState } from './types/MapEntity.type';

type PhysicsEntityState = MapEntityState & {
  body: Box2D.b2Body;
  motion?: MapEntity['motion'];
  originX: number;
  originY: number;
  motionElapsedMs: number;
};

export class Box2dPhysics implements IPhysics {
  private Box2D!: typeof Box2D & EmscriptenModule;
  private gravity!: Box2D.b2Vec2;
  private world!: Box2D.b2World;
  private marbleMap: { [id: number]: Box2D.b2Body } = {};
  private marbleBaseDensity: { [id: number]: number } = {};
  private entities: PhysicsEntityState[] = [];
  private deleteCandidates: Box2D.b2Body[] = [];

  async init(): Promise<void> {
    this.Box2D = await Box2DFactory();
    this.gravity = new this.Box2D.b2Vec2(0, 10);
    this.world = new this.Box2D.b2World(this.gravity);
    console.log('box2d ready');
  }

  clear(): void {
    this.clearEntities();
  }

  clearMarbles(): void {
    Object.values(this.marbleMap).forEach((body) => {
      this.world.DestroyBody(body);
    });
    this.marbleMap = {};
    this.marbleBaseDensity = {};
  }

  createStage(stage: StageDef): void {
    this.createEntities(stage.entities);
  }

  createEntities(entities?: MapEntity[]) {
    if (!entities) return;

    const bodyTypes = {
      static: this.Box2D.b2_staticBody,
      kinematic: this.Box2D.b2_kinematicBody,
    } as const;

    entities.forEach((entity) => {
      const bodyDef = new this.Box2D.b2BodyDef();
      bodyDef.set_type(bodyTypes[entity.type]);
      const body = this.world.CreateBody(bodyDef);

      const fixtureDef = new this.Box2D.b2FixtureDef();
      fixtureDef.set_density(entity.props.density);
      fixtureDef.set_restitution(entity.props.restitution);

      let shape;
      switch (entity.shape.type) {
        case 'box':
          shape = new this.Box2D.b2PolygonShape();
          shape.SetAsBox(entity.shape.width, entity.shape.height, 0, entity.shape.rotation);
          fixtureDef.set_shape(shape);
          body.CreateFixture(fixtureDef);
          break;
        case 'polyline':
          shape = new this.Box2D.b2EdgeShape();
          for (let i = 0; i < entity.shape.points.length - 1; i++) {
            const p1 = entity.shape.points[i];
            const p2 = entity.shape.points[i + 1];
            const v1 = new this.Box2D.b2Vec2(p1[0], p1[1]);
            const v2 = new this.Box2D.b2Vec2(p2[0], p2[1]);
            const edge = new this.Box2D.b2EdgeShape();
            edge.SetTwoSided(v1, v2);
            body.CreateFixture(edge, 1);
          }
          break;
        case 'circle':
          shape = new this.Box2D.b2CircleShape();
          shape.set_m_radius(entity.shape.radius);
          fixtureDef.set_shape(shape);
          body.CreateFixture(fixtureDef);
          break;
      }

      body.SetAngularVelocity(entity.props.angularVelocity);
      body.SetTransform(new this.Box2D.b2Vec2(entity.position.x, entity.position.y), 0);
      this.entities.push({
        body,
        x: entity.position.x,
        y: entity.position.y,
        angle: 0,
        shape: entity.shape,
        life: entity.props.life ?? -1,
        motion: entity.motion,
        originX: entity.position.x,
        originY: entity.position.y,
        motionElapsedMs: 0,
      });
    });
  }

  clearEntities() {
    this.entities.forEach((entity) => {
      this.world.DestroyBody(entity.body);
    });
    this.entities = [];
  }

  createMarble(id: number, x: number, y: number): void {
    const circleShape = new this.Box2D.b2CircleShape();
    circleShape.set_m_radius(0.25);

    const bodyDef = new this.Box2D.b2BodyDef();
    bodyDef.set_type(this.Box2D.b2_dynamicBody);
    bodyDef.set_position(new this.Box2D.b2Vec2(x, y));

    const body = this.world.CreateBody(bodyDef);
    const density = 1 + Math.random();
    body.CreateFixture(circleShape, density);
    body.SetAwake(false);
    body.SetEnabled(false);
    this.marbleMap[id] = body;
    this.marbleBaseDensity[id] = density;
  }

  shakeMarble(id: number): void {
    const body = this.marbleMap[id];
    if (body) {
      body.ApplyLinearImpulseToCenter(new this.Box2D.b2Vec2(Math.random() * 10 - 5, Math.random() * 10 - 5), true);
    }
  }

  removeMarble(id: number): void {
    const marble = this.marbleMap[id];
    if (marble) {
      this.world.DestroyBody(marble);
      delete this.marbleMap[id];
      delete this.marbleBaseDensity[id];
    }
  }

  getMarblePosition(id: number): { x: number; y: number; angle: number } {
    const marble = this.marbleMap[id];
    if (marble) {
      const pos = marble.GetPosition();
      return { x: pos.x, y: pos.y, angle: marble.GetAngle() };
    }
    return { x: 0, y: 0, angle: 0 };
  }

  getMarbleVelocity(id: number): { x: number; y: number } {
    const body = this.marbleMap[id];
    if (!body) return { x: 0, y: 0 };
    const velocity = body.GetLinearVelocity();
    return { x: velocity.x, y: velocity.y };
  }

  setMarbleVelocity(id: number, x: number, y: number): void {
    const body = this.marbleMap[id];
    if (!body) return;
    body.SetLinearVelocity(new this.Box2D.b2Vec2(x, y));
    body.SetAwake(true);
  }

  scaleMarbleVelocity(id: number, multiplier: number): void {
    const velocity = this.getMarbleVelocity(id);
    this.setMarbleVelocity(id, velocity.x * multiplier, velocity.y * multiplier);
  }

  applyMarbleImpulse(id: number, x: number, y: number): void {
    const body = this.marbleMap[id];
    if (!body) return;
    body.ApplyLinearImpulseToCenter(new this.Box2D.b2Vec2(x, y), true);
  }

  setMarblePhysicsProfile(id: number, profile: MarblePhysicsProfile): void {
    const body = this.marbleMap[id];
    if (!body) return;

    const fixture = (body as any).GetFixtureList?.();
    if (!fixture) return;

    if (profile.massMultiplier !== undefined) {
      const density = (this.marbleBaseDensity[id] ?? 1) * profile.massMultiplier;
      fixture.SetDensity?.(density);
      body.ResetMassData?.();
    }
    if (profile.frictionMultiplier !== undefined) {
      fixture.SetFriction?.(0.2 * profile.frictionMultiplier);
    }
    if (profile.restitutionMultiplier !== undefined) {
      fixture.SetRestitution?.(0.2 * profile.restitutionMultiplier);
    }
  }

  setMarbleLinearDamping(id: number, damping: number): void {
    const body = this.marbleMap[id];
    if (!body) return;
    body.SetLinearDamping(damping);
  }

  isMarbleTouchingObstacle(id: number): boolean {
    const body = this.marbleMap[id] as any;
    if (!body) return false;

    const marbleBodies = new Set(Object.values(this.marbleMap));
    let edge = body.GetContactList?.();
    let guard = 0;
    while (edge && guard < 64) {
      if (edge.contact?.IsTouching?.() && edge.other && !marbleBodies.has(edge.other)) return true;
      edge = edge.next;
      guard += 1;
    }
    return false;
  }

  getMarbleCollisionPairs(): MarbleCollisionPair[] {
    const idByBody = new Map<Box2D.b2Body, number>();
    Object.entries(this.marbleMap).forEach(([id, body]) => idByBody.set(body, Number(id)));

    const pairs = new Map<string, MarbleCollisionPair>();
    Object.entries(this.marbleMap).forEach(([idString, body]) => {
      const a = Number(idString);
      let edge = (body as any).GetContactList?.();
      let guard = 0;

      while (edge && guard < 64) {
        const b = idByBody.get(edge.other);
        if (b !== undefined && b !== a && edge.contact?.IsTouching?.()) {
          const first = Math.min(a, b);
          const second = Math.max(a, b);
          pairs.set(`${first}:${second}`, { a: first, b: second });
        }
        edge = edge.next;
        guard += 1;
      }
    });

    return [...pairs.values()];
  }

  getEntities(): MapEntityState[] {
    return this.entities.map((entity) => {
      const position = entity.body.GetPosition();
      return {
        x: position.x,
        y: position.y,
        angle: entity.body.GetAngle(),
        shape: entity.shape,
        life: entity.life,
      };
    });
  }

  impact(id: number): void {
    const src = this.marbleMap[id];
    if (!src) return;

    Object.values(this.marbleMap).forEach((body) => {
      if (body === src) return;

      const distVector = new this.Box2D.b2Vec2(body.GetPosition().x, body.GetPosition().y);
      distVector.op_sub(src.GetPosition());
      const distSq = distVector.LengthSquared();

      if (distSq < 100) {
        distVector.Normalize();
        const power = 1 - distVector.Length() / 10;
        distVector.op_mul(power * power * 5);
        body.ApplyLinearImpulseToCenter(distVector, true);
      }
    });
  }

  start(): void {
    for (const key in this.marbleMap) {
      const marble = this.marbleMap[key];
      marble.SetAwake(true);
      marble.SetEnabled(true);
    }
  }

  step(deltaSeconds: number): void {
    this.deleteCandidates.forEach((body) => {
      this.world.DestroyBody(body);
    });
    this.deleteCandidates = [];

    this.updateEntityMotions(deltaSeconds);
    this.world.Step(deltaSeconds, 6, 2);

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (entity.life > 0) {
        const edge = entity.body.GetContactList();
        if (edge.contact?.IsTouching()) {
          this.deleteCandidates.push(entity.body);
          this.entities.splice(i, 1);
        }
      }
    }
  }

  private updateEntityMotions(deltaSeconds: number) {
    const deltaMs = deltaSeconds * 1000;

    this.entities.forEach((entity) => {
      const motion = entity.motion;
      if (!motion || motion.type !== 'slide') return;

      const distance = Math.max(0, motion.distance);
      const speed = Math.max(0.001, motion.speed);
      if (distance <= 0) return;

      entity.motionElapsedMs += deltaMs;
      const travelMs = (distance / speed) * 1000;
      const holdClosedMs = Math.max(0, motion.holdClosedMs ?? 0);
      const holdOpenMs = Math.max(0, motion.holdOpenMs ?? 0);
      const cycleMs = holdClosedMs + travelMs + holdOpenMs + travelMs;
      const time = entity.motionElapsedMs % Math.max(1, cycleMs);

      let progress = 0;
      if (time < holdClosedMs) {
        progress = 0;
      } else if (time < holdClosedMs + travelMs) {
        progress = (time - holdClosedMs) / travelMs;
      } else if (time < holdClosedMs + travelMs + holdOpenMs) {
        progress = 1;
      } else {
        progress = 1 - (time - holdClosedMs - travelMs - holdOpenMs) / travelMs;
      }

      const direction = motion.direction ?? 1;
      const offset = distance * Math.max(0, Math.min(1, progress)) * direction;
      const x = entity.originX + (motion.axis === 'x' ? offset : 0);
      const y = entity.originY + (motion.axis === 'y' ? offset : 0);
      entity.body.SetTransform(new this.Box2D.b2Vec2(x, y), entity.body.GetAngle());
    });
  }
}