import { SEAT_OBSTRUCTED_COLOR, SEAT_TAKEN_COLOR } from "../globals";
import { isInRange } from "./helpers";

export function greedy(seats, distance) {
  const timeStart = Date.now();
  realGreedy(seats, distance);
  const time = Date.now() - timeStart;

  let arrowSteps = [];
  let colorSteps = [];
  let colorKey = [];

  let seatsTaken = [];
  for (let i = 0; i < seats.length; i++) {
    let noSeatsTakenInRange = true;
    let counter = 0;
    for (let j of seatsTaken) {
      counter++;
      if (isInRange(seats[i], seats[j], distance)) {
        noSeatsTakenInRange = false;
        arrowSteps.push({
          ax: seats[i].x,
          ay: seats[i].y,
          bx: seats[j].x,
          by: seats[j].y,
          color: SEAT_OBSTRUCTED_COLOR,
        });
        break;
      }
      arrowSteps.push({
        ax: seats[i].x,
        ay: seats[i].y,
        bx: seats[j].x,
        by: seats[j].y,
        color: SEAT_TAKEN_COLOR,
      });
    }
    if (noSeatsTakenInRange) seatsTaken.push(i);
    colorKey[i] = noSeatsTakenInRange ? SEAT_TAKEN_COLOR : SEAT_OBSTRUCTED_COLOR;
    for (let j = 0; j < counter; j++) {
      colorSteps.push(colorKey.slice());
    }
  }

  return [arrowSteps, colorSteps, time, null];
}

export function realGreedy(seats, distance) {
  let seatsTaken = [];
  for (let i = 0; i < seats.length; i++) {
    let noSeatsTakenInRange = true;
    for (let j of seatsTaken) {
      if (isInRange(seats[i], seats[j], distance)) {
        noSeatsTakenInRange = false;
        break;
      }
    }
    if (noSeatsTakenInRange) seatsTaken.push(i);
  }
  return seatsTaken;
}
