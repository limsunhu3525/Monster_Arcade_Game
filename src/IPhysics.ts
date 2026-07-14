import type { StageDef } from './data/maps';
import type { MapEntityState } from './types/MapEntity.type';

export interface MarblePhysicsProfile {
  massMultiplier?: number;
  frictionMultiplier?: number;
  restitutionMultiplier?: number;
}

export interface IPhysics {
  init(): Promise<void>;

  clear(): void;

  clearMarbles(): void;

  createStage(stage: StageDef): void;

  createMarble(id: number, x: number, y: number): void;

  shakeMarble(id: number): void;

  removeMarble(id: number): void;

  getMarblePosition(id: number): { x: number; y: number; angle: number };

  getMarbleVelocity(id: number): { x: number; y: number };

  setMarbleVelocity(id: number, x: number, y: number): void;

  scaleMarbleVelocity(id: number, multiplier: number): void;

  applyMarbleImpulse(id: number, x: number, y: number): void;

  setMarblePhysicsProfile(id: number, profile: MarblePhysicsProfile): void;

  setMarbleLinearDamping(id: number, damping: number): void;

  isMarbleTouchingObstacle(id: number): boolean;

  getEntities(): MapEntityState[];

  impact(id: number): void;

  start(): void;

  step(deltaSeconds: number): void;
}
