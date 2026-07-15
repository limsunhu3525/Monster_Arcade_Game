import { crazyMap } from './crazyMap';
import { stages } from './maps';

export const registerCrazyMap = () => {
  if (stages.some((stage) => stage.title === crazyMap.title)) return;
  stages.splice(1, 0, crazyMap);
};
