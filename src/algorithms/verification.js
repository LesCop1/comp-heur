import { SEAT_OBSTRUCTED_COLOR, SEAT_TAKEN_COLOR } from "../globals";
import { isInRange } from "./helpers";

export function verify(seatsData, seatsColor, distance) {
  const timeStart = Date.now();
  realVerify(seatsData, seatsColor, distance);
  const time = Date.now() - timeStart;

  const arrowSteps = [];
  const colorSteps = [];
  const colorKey = [];

  for (let i = 0; i < seatsColor.length; i++) {
    colorKey[i] = seatsColor[i] === SEAT_OBSTRUCTED_COLOR ? SEAT_TAKEN_COLOR : seatsColor[i];
  }

  const seatsTaken = seatsColor
    .map((value, index) => {
      if (value === SEAT_TAKEN_COLOR || value === SEAT_OBSTRUCTED_COLOR) return index;
    })
    .filter((val) => {
      return val != null;
    });

  for (let i = 0; i < seatsTaken.length - 1; i++) {
    for (let j = i + 1; j < seatsTaken.length; j++) {
      if (isInRange(seatsData[seatsTaken[i]], seatsData[seatsTaken[j]], distance)) {
        arrowSteps.push({
          ax: seatsData[seatsTaken[i]].x,
          ay: seatsData[seatsTaken[i]].y,
          bx: seatsData[seatsTaken[j]].x,
          by: seatsData[seatsTaken[j]].y,
          color: SEAT_OBSTRUCTED_COLOR,
        });
        colorKey[seatsTaken[i]] = SEAT_OBSTRUCTED_COLOR;
        colorKey[seatsTaken[j]] = SEAT_OBSTRUCTED_COLOR;
        colorSteps.push(colorKey.slice());

        return [arrowSteps, colorSteps, time, false];
      }
      arrowSteps.push({
        ax: seatsData[seatsTaken[i]].x,
        ay: seatsData[seatsTaken[i]].y,
        bx: seatsData[seatsTaken[j]].x,
        by: seatsData[seatsTaken[j]].y,
        color: SEAT_TAKEN_COLOR,
      });
      colorSteps.push(colorKey.slice());
    }
  }

  return [arrowSteps, colorSteps, time, true];
}

function realVerify(seatsData, seatsColor, distance) {
  const seatsTaken = seatsColor
    .map((value, index) => {
      if (value === SEAT_TAKEN_COLOR) return index;
    })
    .filter((val) => {
      return val != null;
    });

  for (let i = 0; i < seatsTaken.length - 1; i++) {
    for (let j = i + 1; j < seatsTaken.length; j++) {
      if (isInRange(seatsData[seatsTaken[i]], seatsData[seatsTaken[j]], distance)) {
        return false;
      }
    }
  }
  return true;
}
