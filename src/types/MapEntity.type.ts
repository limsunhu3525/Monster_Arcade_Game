import type { VectorLike } from './VectorLike';

export type EntityShapeTypes = 'box' | 'circle' | 'polyline';

export interface EntityShapeBase {
  type: EntityShapeTypes;
  color?: string;
  bloomColor?: string;
}

export interface EntityBoxShape extends EntityShapeBase {
  type: 'box';
  width: number;
  height: number;
  rotation: number;
}

export interface EntityCircleShape extends EntityShapeBase {
  type: 'circle';
  radius: number;
}

export interface EntityPolylineShape extends EntityShapeBase {
  type: 'polyline';
  rotation: number;
  points: [number, number][];
}

export type EntityShape = EntityBoxShape | EntityCircleShape | EntityPolylineShape;

export type EntityPhysicalProps = {
  density: number;
  restitution: number;
  angularVelocity: number;
  life?: number;
};

export interface EntitySlideMotion {
  type: 'slide';
  axis: 'x' | 'y';
  distance: number;
  speed: number;
  direction?: -1 | 1;
  holdClosedMs?: number;
  holdOpenMs?: number;
}

export type EntityMotion = EntitySlideMotion;

export interface MapEntity {
  position: VectorLike;
  type: 'static' | 'kinematic';
  shape: EntityShape;
  props: EntityPhysicalProps;
  motion?: EntityMotion;
}

export interface MapEntityState {
  x: number;
  y: number;
  angle: number;
  shape: EntityShape;
  life: number;
}