import { getKeyPoint, isEqualPosition } from "./index";
import { findDistance } from ".";
import {
  CoordinateType,
  PointsFormatType,
  PointsFormatObj,
  PointsFormatObjRecusive,
  PointsType,
  VerticesType,
} from "./../type";
import verticesFormat from "../configs/navMesh";

export const findPath = ({
  start,
  target,
}: {
  start: PointsFormatObj<null> | PointsFormatObjRecusive;
  target: PointsFormatObj<null> | PointsFormatObjRecusive;
}) => {
  const pointsFormatS = structuredClone(verticesFormat);
  if (!start || !target) return [];
  start.f = 0 + findDistance(start.points, target.points);

  const open = [start];

  while (open.length != 0) {
    const next = open[0];

    open.shift();

    if (isEqualPosition(next.points, target.points)) {
      let path: CoordinateType[] = [];

      const getPrev = (
        current: PointsFormatObjRecusive | PointsFormatObj<null>
      ) => {
        path.push(current?.points);

        if (current?.prev) getPrev(current?.prev);
      };

      getPrev(next);

      return path;
    }

    next.neighBors.forEach((item) => {
      if (isEqualPosition(item, next.points)) return;

      const currentNeighbor = pointsFormatS[getKeyPoint(item)];

      if (currentNeighbor) {
        const newG =
          (next.g || 0) + findDistance(next.points, currentNeighbor.points);

        if (newG < currentNeighbor.g || currentNeighbor.g === null) {
          currentNeighbor.g = newG;
          currentNeighbor.f =
            newG + 2 * findDistance(currentNeighbor.points, target.points);

          if (
            !open.some((e) => isEqualPosition(e.points, currentNeighbor.points))
          ) {
            currentNeighbor.prev = next;
            open.push(currentNeighbor);
            open.sort((a, b) => (a.f as number) - (b.f as number));
          }
        }
      }
    });
  }
};
