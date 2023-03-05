import { CoordinateType, VerticesType } from "./../type";

const max = Math.max;
const abs = Math.abs;

// manhatan distance
export const findDistance = (pos1: CoordinateType, pos2: CoordinateType) => {
  return max(abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1]));
};

export const isEqualPosition = (pos1: CoordinateType, pos2: CoordinateType) => {
  return pos1?.[0] == pos2?.[0] && pos1?.[1] == pos2?.[1];
};

export const getKeyPoint = (pos: CoordinateType) => `${pos?.[0]}/${pos?.[1]}`;

export const findNearestPosition = (
  vertices: VerticesType,
  curentPosition: CoordinateType
) => {
  let nearest: CoordinateType | null = null;
  let nearestDistance: number | null = null;

  Object.values(vertices).forEach((item) => {
    const distanceTo = max(
      abs(curentPosition[0] - item.points[0]) +
        abs(curentPosition[1] - item.points[1])
    );
    if (!nearest || distanceTo <= (nearestDistance as number)) {
      nearest = item.points;
      nearestDistance = distanceTo;
    }
  });

  return nearest as unknown as CoordinateType;
};
