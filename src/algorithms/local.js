import { realGreedy } from "./greedy";
import { isInRange, isSeatAvailable } from "./helpers";
import { SEAT_DEFAULT_COLOR, SEAT_OBSTRUCTED_COLOR, SEAT_TAKEN_COLOR } from "../globals";

function swap(seatsData, seatsTaken, distance, index, newPlaceTaken, arrowSteps, colorSteps, colorKey) {
  const newSeatsTaken = [...seatsTaken];

  const colorIndex = newSeatsTaken[index];

  newSeatsTaken.splice(index, 1);

  arrowSteps.push(null);
  colorKey[colorIndex] = SEAT_DEFAULT_COLOR;
  colorSteps.push(colorKey.slice());

  newSeatsTaken.push(newPlaceTaken);

  arrowSteps.push(null);
  colorKey[newPlaceTaken] = SEAT_TAKEN_COLOR;
  colorSteps.push(colorKey.slice());

  for (let i = 0; i < newSeatsTaken.length - 1; i++) {
    if (isInRange(seatsData[newSeatsTaken[i]], seatsData[newSeatsTaken[newSeatsTaken.length - 1]], distance)) {
      const index = newSeatsTaken[i];

      arrowSteps.push({
        ax: seatsData[newSeatsTaken[i]].x,
        ay: seatsData[newSeatsTaken[i]].y,
        bx: seatsData[newSeatsTaken[newSeatsTaken.length - 1]].x,
        by: seatsData[newSeatsTaken[newSeatsTaken.length - 1]].y,
        color: SEAT_OBSTRUCTED_COLOR,
      });
      colorKey[index] = SEAT_TAKEN_COLOR;
      colorSteps.push(colorKey.slice());

      newSeatsTaken.splice(i, 1);

      arrowSteps.push(null);
      colorKey[index] = SEAT_DEFAULT_COLOR;
      colorSteps.push(colorKey.slice());

      i--;
    } else {
      arrowSteps.push({
        ax: seatsData[newSeatsTaken[i]].x,
        ay: seatsData[newSeatsTaken[i]].y,
        bx: seatsData[newSeatsTaken[newSeatsTaken.length - 1]].x,
        by: seatsData[newSeatsTaken[newSeatsTaken.length - 1]].y,
        color: SEAT_TAKEN_COLOR,
      });
      colorSteps.push(colorKey.slice());
    }
  }

  for (let i = 0; i < seatsData.length; i++) {
    if (isSeatAvailable(seatsData, i, newSeatsTaken, distance)) {
      newSeatsTaken.push(i);

      arrowSteps.push(null);
      colorKey[i] = SEAT_TAKEN_COLOR;
      colorSteps.push(colorKey.slice());
    }
  }

  return newSeatsTaken.sort();
}

export function local(seatsData, distance, maxIteration, maxTime) {
  const timeStart = Date.now();
  realLocal(seatsData, distance, maxIteration, maxTime);
  const time = Date.now() - timeStart;

  let arrowSteps = [];
  let colorSteps = [];
  let colorKey;

  let seatsTaken = realGreedy(seatsData, distance);

  arrowSteps.push(null);
  colorKey = [...Array(seatsData.length).keys()].map((_, i) =>
    seatsTaken.includes(i) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
  );
  colorSteps.push(colorKey.slice());

  let iteration = 0;
  let startTime = Date.now();
  while (iteration <= maxIteration && Date.now() - startTime <= maxTime) {
    const indexToDelete = Math.floor(Math.random() * seatsTaken.length);
    const newPlaceTaken = [...Array(seatsData.length).keys()].filter((val) => !seatsTaken.includes(val))[
      Math.floor(Math.random() * (seatsData.length - seatsTaken.length))
    ];

    const newSeatsTaken = swap(
      seatsData,
      seatsTaken,
      distance,
      indexToDelete,
      newPlaceTaken,
      arrowSteps,
      colorSteps,
      colorKey
    );
    arrowSteps.push(null);
    colorKey = [...Array(seatsData.length).keys()].map((_, i) =>
      newSeatsTaken.includes(i) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
    );
    colorSteps.push(colorKey.slice());

    if (newSeatsTaken.length > seatsTaken.length) {
      seatsTaken = newSeatsTaken;
    } else {
      arrowSteps.push(null);
      colorKey = [...Array(seatsData.length).keys()].map((_, i) =>
        seatsTaken.includes(i) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
      );
      colorSteps.push(colorKey.slice());
    }

    iteration++;
  }
  arrowSteps.push(null);
  colorSteps.push(colorKey.slice());

  return [arrowSteps, colorSteps, time, null];
}

function realSwap(seatsData, seatsTaken, distance, index, newPlaceTaken) {
  const newSeatsTaken = [...seatsTaken];

  newSeatsTaken.splice(index, 1);
  newSeatsTaken.push(newPlaceTaken);

  for (let i = 0; i < newSeatsTaken.length - 1; i++) {
    if (isInRange(seatsData[newSeatsTaken[i]], seatsData[newSeatsTaken[newSeatsTaken.length - 1]], distance)) {
      newSeatsTaken.splice(i, 1);
      i--;
    }
  }

  for (let i = 0; i < seatsData.length; i++) {
    if (isSeatAvailable(seatsData, i, newSeatsTaken, distance)) {
      newSeatsTaken.push(i);
    }
  }

  return newSeatsTaken.sort();
}

function realLocal(seatsData, distance, maxIteration, maxTime) {
  let seatsTaken = realGreedy(seatsData, distance);

  let iteration = 0;
  let startTime = Date.now();
  while (iteration <= maxIteration && Date.now() - startTime <= maxTime) {
    const indexToDelete = Math.floor(Math.random() * seatsTaken.length);
    const newPlaceTaken = [...Array(seatsData.length).keys()].filter((val) => !seatsTaken.includes(val))[
      Math.floor(Math.random() * (seatsData.length - seatsTaken.length))
    ];

    const newSeatsTaken = realSwap(seatsData, seatsTaken, distance, indexToDelete, newPlaceTaken);
    if (newSeatsTaken.length > seatsTaken.length) seatsTaken = newSeatsTaken;

    iteration++;
  }

  return seatsTaken;
}
