const regex = new RegExp("(\\w+\\s*?;\\s*?([0-9]*[.])?[0-9]+\\s*?;\\s*?([0-9]*[.])?[0-9]+\\s*?)");

export function checkSyntax(data) {
  const lines = data.split("\n");
  for (let line of lines) {
    if (!regex.test(line)) return false;
  }
  return true;
}

export function exportToArray(data) {
  const arr = [];
  const lines = data.split("\n");

  for (let line of lines) {
    const lineData = line.split(";");
    const newSeat = {
      name: lineData[0].trim(),
      x: Number(lineData[1]),
      y: Number(lineData[2]),
    };
    arr.push(newSeat);
  }
  return arr;
}

export function getHighestSeatsCoords(seats) {
  let x = 0,
    y = 0;

  if (seats) {
    for (let seat of seats) {
      if (seat.x > x) x = seat.x;
      if (seat.y > y) y = seat.y;
    }
  }
  return { x, y };
}

export function isInRange(a, b, d) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)) < d;
}

export function isSeatAvailable(seatsData, i, takenSeats, distance) {
  for (const takenSeat of takenSeats) {
    if (isInRange(seatsData[i], seatsData[takenSeat], distance)) {
      return false;
    }
  }
  return true;
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
