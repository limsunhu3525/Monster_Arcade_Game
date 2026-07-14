import Box2DFactory from 'box2d-wasm';
import type { StageDef } from './data/maps';
import type { IPhysics, MarblePhysicsProfile } from './IPhysics';
import type { MapEntity, MapEntityState } from './types/MapEntity.type';

export class Box2dPhysics implements IPhysics {
  private Box2D!: typeof Box2D & EmscriptenModule;
  private gravity!: Box2D.b2Vec2;
  private world!: Box2D