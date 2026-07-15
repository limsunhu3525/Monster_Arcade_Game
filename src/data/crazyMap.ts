import type { MapEntity } from '../types/MapEntity.type';
import type { StageDef } from './maps';

const NEON_RED = '#ff1744';
const HOT_RED = '#ff003c';
const DEEP_RED = '#d50032';
const RED_BLOOM = '#ff0055';

const staticBox = (
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0,
  restitution = 0.15,
  color