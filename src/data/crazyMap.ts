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
  color = NEON_RED
): MapEntity => ({
  position: { x, y },
  type: 'static',
  shape: { type: 'box', width, height, rotation, color, bloomColor: RED_BLOOM },
  props: { density: 1, restitution, angularVelocity: 0 },
});

const bumper = (x: number, y: number, radius = 0.42, restitution = 0.95): MapEntity => ({
  position: { x, y },
  type: 'static',
  shape: { type: 'circle', radius, color: HOT_RED, bloomColor: RED_BLOOM },
  props: { density: 1, restitution, angularVelocity: 0 },
});

const spinner = (
  x: number,
  y: number,
  width: number,
  angularVelocity: number,
  rotation = 0,
  color = NEON_RED
): MapEntity => ({
  position: { x, y },
  type: 'kinematic',
  shape: { type: 'box', width, height: 0.16, rotation, color, bloomColor: RED_BLOOM },
  props: { density: 1, restitution: 0.35, angularVelocity },
});

const pinField = (
  startY: number,
  rows: number,
  columns: number,
  gapX: number,
  gapY: number,
  offsetEveryOtherRow = true
): MapEntity[] => {
  const items: MapEntity[] = [];
  const totalWidth = (columns - 1) * gapX;
  const startX = 16 - totalWidth / 2;

  for (let row = 0; row < rows; row += 1) {
    const offset = offsetEveryOtherRow && row % 2 === 1 ? gapX / 2 : 0;
    for (let col = 0; col < columns; col += 1) {
      const x = startX + col * gapX + offset;
      if (x > 23.1) continue;
      items.push(bumper(x, startY + row * gapY, row % 3 === 0 ? 0.46 : 0.36, row % 2 === 0 ? 1.05 : 0.82));
    }
  }

  return items;
};

const crossSpinner = (x: number, y: number, size: number, angularVelocity: number): MapEntity[] => [
  spinner(x, y, size, angularVelocity, 0, HOT_RED),
  spinner(x, y, size, angularVelocity, Math.PI / 2, DEEP_RED),
];

const crazyEntities: MapEntity[] = [
  // Long outer rails. The start area must contain the engine's fixed marble spawn grid.
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
        [7.8, 145],
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
        [24.2, 145],
      ],
    },
    props: { density: 1, restitution: 0.2, angularVelocity: 0 },
  },

  // Opening funnel: instantly breaks the starting pack into several collision lines.
  staticBox(10.5, 10.8, 3.2, 0.16, 0.24, 0.18),
  staticBox(21.5, 10.8, 3.2, 0.16, -0.24, 0.18),
  bumper(16, 13.6, 0.62, 1.08),

  // First pinball field.
  ...pinField(17.5, 5, 5, 3.0, 3.0),

  // Counter-rotating sweepers. Timing differences immediately create overtakes.
  spinner(11.7, 34.5, 3.1, 2.65, 0.12),
  spinner(20.3, 34.5, 3.1, -2.35, -0.18, HOT_RED),
  bumper(16, 35.2, 0.55, 1.12),

  // Split-and-rejoin ramps. Safe-looking lines often converge into the center melee.
  staticBox(11.0, 42.0, 3.6, 0.14, 0.42, 0.28),
  staticBox(21.0, 42.0, 3.6, 0.14, -0.42, 0.28),
  staticBox(12.6, 49.0, 3.1, 0.14, -0.30, 0.22, DEEP_RED),
  staticBox(19.4, 49.0, 3.1, 0.14, 0.30, 0.22, DEEP_RED),
  bumper(10.0, 46.0, 0.5, 1.0),
  bumper(22.0, 46.0, 0.5, 1.0),
  bumper(16.0, 51.0, 0.65, 1.15),

  // The blender: two rotating crosses with different angular speeds.
  ...crossSpinner(12.0, 58.0, 2.7, 3.15),
  ...crossSpinner(20.0, 58.0, 2.7, -2.75),
  spinner(16.0, 64.0, 4.3, 1.85, 0.08, HOT_RED),

  // Dense chaos chamber. High-restitution bumpers send racers into different lanes.
  bumper(9.5, 69.0, 0.5, 1.12),
  bumper(13.0, 68.0, 0.42, 0.92),
  bumper(16.0, 70.0, 0.58, 1.18),
  bumper(19.0, 68.0, 0.42, 0.92),
  bumper(22.5, 69.0, 0.5, 1.12),
  bumper(11.0, 74.0, 0.55, 1.08),
  bumper(15.0, 75.0, 0.44, 0.9),
  bumper(18.0, 74.0, 0.44, 0.9),
  bumper(21.0, 75.0, 0.55, 1.08),

  // Narrow zig-zag compression zone: builds a pack again before the next explosion.
  staticBox(10.4, 81.5, 3.0, 0.15, 0.36, 0.25),
  staticBox(21.6, 81.5, 3.0, 0.15, -0.36, 0.25),
  staticBox(13.0, 87.0, 3.5, 0.15, -0.28, 0.28, HOT_RED),
  staticBox(19.0, 87.0, 3.5, 0.15, 0.28, 0.28, HOT_RED),

  // Triple roulette gates. No lane stays consistently safe.
  spinner(10.8, 94.0, 2.45, -3.35, 0.2),
  spinner(16.0, 94.0, 2.9, 2.65, -0.15, HOT_RED),
  spinner(21.2, 94.0, 2.45, -3.05, 0.25),
  bumper(13.4, 98.5, 0.48, 1.08),
  bumper(18.6, 98.5, 0.48, 1.08),

  // Second pin field, offset from the first to reshuffle any established order.
  ...pinField(103.0, 4, 6, 2.35, 3.0),

  // Final gauntlet: a converging funnel, a last cross, then an open sprint to the line.
  staticBox(10.8, 117.0, 3.3, 0.15, 0.46, 0.3),
  staticBox(21.2, 117.0, 3.3, 0.15, -0.46, 0.3),
  ...crossSpinner(16.0, 122.5, 3.4, 3.45),
  bumper(10.0, 126.0, 0.5, 1.1),
  bumper(22.0, 126.0, 0.5, 1.1),
];

export const crazyMap: StageDef = {
  title: '미친맵',
  goalY: 136,
  zoomY: 130.5,
  entities: crazyEntities,
};
