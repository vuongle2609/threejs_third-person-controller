import { CoordinateType, PointsFormatType, VerticesType } from "../type";
import { getKeyPoint } from "../utils";

const verticesFormat: PointsFormatType = {};

const vertices: VerticesType = {};

const distance = 12;

const findNeighbors = (pos: CoordinateType): CoordinateType[] => {
  const [x, y] = pos;

  const top = [x, y + distance];

  const left = [x - distance, y];

  const right = [x + distance, y];

  const bot = [x, y - distance];

  return [top, left, right, bot];
};

for (let i = -60; i <= 60; i += distance) {
  for (let j = -60; j <= 60; j += distance) {
    vertices[getKeyPoint([i, j])] = {
      points: [i, j],
      neighBors: findNeighbors([i, j]),
    };
  }
}

Object.keys(vertices).forEach((item) => {
  verticesFormat[item] = {
    ...vertices[item],
    g: null,
    f: null,
    prev: null,
  };
});

export default verticesFormat;
