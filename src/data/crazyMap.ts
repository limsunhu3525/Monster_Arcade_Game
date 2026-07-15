import type { MapEntity } from '../types/MapEntity.type';
import type { StageDef } from './maps';

const NEON_RED = '#ff1744';
const HOT_RED = '#ff003c';
const DEEP_RED = '#d50032';
const RED_BLOOM = '#ff0055';

const rail = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness = 0.14,
  restitution = 0.15,
  color = NEON_RED
): MapEntity => ({
  position: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 },
  type: 'static',
  shape: {
    type: 'box',
    width: Math.hypot(x2 - x1, y2 - y1) / 2,
    height: thickness,
    rotation: Math.atan2(y2 - y1, x2 - x1),
    color,
    bloomColor: RED_BLOOM,
  },
  props: { density: 1, restitution, angularVelocity: 0 },
});

const bumper = (x: number, y: number, radius = 0.4, restitution = 0.95): MapEntity => ({
  position: { x, y },
  type: 'static',
  shape: { type: 'circle', radius, color: HOT_RED, bloomColor: RED_BLOOM },
  props: { density: 1, restitution, angularVelocity: 0 },
});

const spinner = (
  x: number,
  y: number,
  halfLength: number,
  angularVelocity: number,
  rotation = 0,
  color = NEON_RED
): MapEntity => ({
  position: { x, y },
  type: 'kinematic',
  shape: {
    type: 'box',
    width: halfLength,
    height: 0.15,
    rotation,
    color,
    bloomColor: RED_BLOOM,
  },
  props: { density: 1, restitution: 0.32, angularVelocity },
});

const crossSpinner = (x: number, y: number, halfLength: number, angularVelocity: number): MapEntity[] => [
  spinner(x, y, halfLength, angularVelocity, 0, HOT_RED),
  spinner(x, y, halfLength, angularVelocity, Math.PI / 2, DEEP_RED),
];

const slidingGateHalf = (x: number, y: number, direction: -1 | 1): MapEntity => ({
  position: { x, y },
  type: 'kinematic',
  shape: {
    type: 'box',
    width: 1.2,
    height: 0.18,
    rotation: 0,
    color: HOT_RED,
    bloomColor: RED_BLOOM,
  },
  props: { density: 1, restitution: 0.18, angularVelocity: 0 },
  motion: {
    type: 'slide',
    axis: 'x',
    distance: 2.6,
    speed: 2.4,
    direction,
    holdClosedMs: 2400,
    holdOpenMs: 1700,
  },
});

const pinRow = (y: number, xs: number[], radius = 0.38): MapEntity[] =>
  xs.map((x, index) => bumper(x, y, radius, index % 2 === 0 ? 1.02 : 0.86));

const crazyEntities: MapEntity[] = [
  // Outer rails. Everything inside remains physically contained.
  {
    position: { x: 0, y: 0 },
    type: 'static',
    shape: {
      type: 'polyline',
      rotation: 0,
      color: NEON_RED,
      bloomColor: RED_BLOOM,
      points: [
        [7.8, -300],
        [7.8, 175],
      ],
    },
    props: { density: 1, restitution: 0.2, angularVelocity: 0 },
  },
  {
    position: { x: 0, y: 0 },
    type: 'static',
    shape: {
      type: 'polyline',
      rotation: 0,
      color: NEON_RED,
      bloomColor: RED_BLOOM,
      points: [
        [24.2, -300],
        [24.2, 175],
      ],
    },
    props: { density: 1, restitution: 0.2, angularVelocity: 0 },
  },

  // Opening funnel. The two rails never meet and leave a wide central route.
  rail(8.8, 10.5, 12.0, 13.8, 0.14, 0.16),
  rail(23.2, 10.5, 20.0, 13.8, 0.14, 0.16),
  bumper(13.2, 15.5, 0.42, 1.04),
  bumper(18.8, 15.5, 0.42, 1.04),

  // Pinball field. Every row keeps a guaranteed central gap.
  ...pinRow(19, [10.2, 13.1, 18.9, 21.8]),
  ...pinRow(23, [11.4, 14.4, 17.6, 20.6]),
  ...pinRow(27, [10.2, 13.1, 18.9, 21.8]),
  ...pinRow(31, [11.4, 14.4, 17.6, 20.6]),

  // Side sweepers create overtakes without ever spanning the whole map.
  spinner(11.3, 36.5, 2.0, 2.7, 0.08),
  spinner(20.7, 36.5, 2.0, -2.45, -0.1, HOT_RED),
  bumper(14.0, 39.5, 0.4, 0.92),
  bumper(18.0, 39.5, 0.4, 0.92),

  // Split-and-rejoin ramps. Endpoints remain separated so no V-shaped wall can form.
  rail(8.8, 43.0, 12.8, 47.0, 0.14, 0.22),
  rail(23.2, 43.0, 19.2, 47.0, 0.14, 0.22),
  rail(10.0, 52.0, 13.0, 55.0, 0.14, 0.2, DEEP_RED),
  rail(22.0, 52.0, 19.0, 55.0, 0.14, 0.2, DEEP_RED),

  // Two independent blenders. The center and outer lanes can always recover.
  ...crossSpinner(11.5, 60.0, 1.9, 3.0),
  ...crossSpinner(20.5, 60.0, 1.9, -2.75),
  bumper(14.0, 64.0, 0.42, 1.06),
  bumper(18.0, 64.0, 0.42, 1.06),

  // Dense chaos chamber with staggered bumpers and no connected static wall.
  bumper(9.8, 68.0, 0.5, 1.1),
  bumper(12.8, 70.0, 0.4, 0.92),
  bumper(19.2, 70.0, 0.4, 0.92),
  bumper(22.2, 68.0, 0.5, 1.1),
  bumper(11.2, 75.0, 0.45, 1.04),
  bumper(14.0, 77.0, 0.38, 0.9),
  bumper(18.0, 77.0, 0.38, 0.9),
  bumper(20.8, 75.0, 0.45, 1.04),

  // Regrouping funnel. Rails guide the pack toward the gate but stop well before touching.
  rail(8.8, 82.0, 13.2, 89.0, 0.14, 0.16),
  rail(23.2, 82.0, 18.8, 89.0, 0.14, 0.16),
  rail(13.2, 89.0, 13.6, 92.0, 0.13, 0.12, DEEP_RED),
  rail(18.8, 89.0, 18.4, 92.0, 0.13, 0.12, DEEP_RED),

  // Sliding gate: fully closed for regrouping, then opens to a gap far wider than one marble.
  slidingGateHalf(14.7, 92.5, -1),
  slidingGateHalf(17.3, 92.5, 1),

  // Exit rails angle outward, preventing a second bottleneck immediately after the release.
  rail(13.6, 95.0, 11.8, 99.0, 0.13, 0.14, HOT_RED),
  rail(18.4, 95.0, 20.2, 99.0, 0.13, 0.14, HOT_RED),
  bumper(13.2, 101.5, 0.38, 0.9),
  bumper(18.8, 101.5, 0.38, 0.9),

  // Moving hazards stay short enough that another route always exists around them.
  spinner(12.0, 106.0, 1.9, -3.15, 0.16),
  spinner(20.0, 106.0, 1.9, 2.9, -0.14, HOT_RED),

  // Second pin field reshuffles the order while preserving the central safety lane.
  ...pinRow(114, [10.2, 13.1, 18.9, 21.8]),
  ...pinRow(118, [11.4, 14.4, 17.6, 20.6]),
  ...pinRow(122, [10.2, 13.1, 18.9, 21.8]),

  // Final chaos zone, again using independent side obstacles instead of a connected V.
  rail(8.8, 133.0, 12.6, 137.0, 0.14, 0.22),
  rail(23.2, 133.0, 19.4, 137.0, 0.14, 0.22),
  ...crossSpinner(11.5, 138.5, 1.8, 3.25),
  ...crossSpinner(20.5, 138.5, 1.8, -3.0),
  bumper(10.0, 141.0, 0.45, 1.04),
  bumper(22.0, 141.0, 0.45, 1.04),

  // Final finish funnel. It narrows gradually and never closes into a point.
  rail(8.8, 145.0, 14.2, 153.0, 0.16, 0.12, HOT_RED),
  rail(23.2, 145.0, 17.8, 153.0, 0.16, 0.12, HOT_RED),

  // Long narrow finish chute. Racers must travel through this corridor before crossing goalY.
  // The passage narrows from 3.6 to 3.0 world units, which is still six marble diameters wide.
  rail(14.2, 153.0, 14.5, 171.0, 0.16, 0.08, DEEP_RED),
  rail(17.8, 153.0, 17.5, 171.0, 0.16, 0.08, DEEP_RED),
];

export const crazyMap: StageDef = {
  title: '미친맵',
  goalY: 172.5,
  zoomY: 166.5,
  entities: crazyEntities,
};