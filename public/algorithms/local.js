/**
 * Check if the data string respect the input format (data1 ; data2 ; data3).
 *
 * @param {String} data The data string
 * @return {boolean} Returns true if data respect the regex.
 */
function checkSyntax(data) {
  const lines = data.split("\n");
  for (let line of lines) {
    if (!new RegExp("(\\w+\\s*?;\\s*?([0-9]*[.])?[0-9]+\\s*?;\\s*?([0-9]*[.])?[0-9]+\\s*?)").test(line)) return false;
  }
  return true;
}

/**
 * Returns a formatted array for the seats.
 *
 * @param {String} data The data string
 * @return {[{name: String, x: Number, y: Number}]} The formatted array
 */
function importSeatsData(data) {
  if (checkSyntax(data)) {
    const arr = [];
    const lines = data.split("\n");

    for (let line of lines) {
      const lineData = line.split(";");
      const newSeat = {
        name: lineData[0].trim(),
        x: Number(lineData[1]),
        y: Number(lineData[2])
      }
      arr.push(newSeat);
    }
    return arr;
  }

  return [];
}

/**
 * Calculates if the distance between A and B and then returns if this distance is smaller than D value.
 *
 * @param {{name: String, x: Number, y: Number}} a Vector1
 * @param {{name: String, x: Number, y: Number}} b Vector2
 * @param {Number} d Distance
 * @returns {boolean} True if the distance between A and B is smaller than D
 */
function isInRange(a, b, d) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)) < d;
}

/**
 * Check if the given seat's index can be place.
 * This algorithm will check all the current takenSeats to see if the seat is not in range
 *
 * @param {[{name: String, x: Number, y: Number}]} seatsData The seats configuration
 * @param {Number} i The seat's index to check
 * @param {[Number]} takenSeats An array with the taken seats based on "seatsData"
 * @param {Number} distance The minimum distance between each seats
 * @returns {boolean}
 */
function isSeatAvailable(seatsData, i, takenSeats, distance) {
  for (const takenSeat of takenSeats) {
    if (isInRange(seatsData[i], seatsData[takenSeat], distance)) {
      return false;
    }
  }
  return true;
}

/**
 * The main algorithm to resolve, in a greedy way, the MSA problem.
 * This algorithm loops over every seats and it'll check if previous occupied seat are in range.
 * If all previous occupied seat are not in range, this seat becomes a new occupied seat.
 * If all previous occupied seat are in range, nothing happens and the loop continues
 *
 * @param {[{name: String, x: Number, y: Number}]} seats The seats configuration
 * @param {Number} distance The minimum distance between each seats
 * @returns {Number[]} An array with the index of the occupied seat based on "seats"
 */
function greedy(seats, distance) {
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

/**
 * The local search procedure used by "local".
 * This algorithm will remove one takenPlace and add a new one.
 * Then check if all other taken places are not in range with the new one.
 * If they are in range, it'll remove them.
 * Then, we'll check if there's a way to had even more places.
 *
 * @param {[{name: String, x: Number, y: Number}]} seatsData The seats configuration
 * @param {[Number]} seatsTaken An array with the taken seats based on "seats"
 * @param {Number} distance The minimum distance between each seats
 * @param {Number} index The seat's index to be deleted.
 * @param {Number} newPlaceTaken The new seat to be added to seatsTaken
 * @returns {[Number]} An array with the index of the occupied seat based on "seatsData"
 */
function swap(seatsData, seatsTaken, distance, index, newPlaceTaken) {
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

/**
 * The main algorithm to resolve, using local search procedures, the MSA problem.
 * The algorithm will start with a greedy solution then, it'll randomly selected a new place
 * When this new place is chosed, it'll check if it's not in range with other taken places.
 * If some of them are in ranged, it'll delete them.
 * Then the problem keeps looping while maxIteration or maxTime is reached.
 *
 * @param {[{name: String, x: Number, y: Number}]} seatsData The seats configuration
 * @param {Number} distance The minimum distance between each seats
 * @param {Number} maxIteration The maximum number of iteration
 * @param {Number} maxTime The maximum time spent on the algorithm
 * @returns {Number[]} An array with the index of the occupied seat based on "seatsData"
 */
function local(seatsData, distance, maxIteration, maxTime) {
  let seatsTaken = greedy(seatsData, distance);

  let iteration = 0;
  let startTime = Date.now();
  while (iteration <= maxIteration && Date.now() - startTime <= maxTime) {
    const indexToDelete = Math.floor(Math.random() * seatsTaken.length);
    const newPlaceTaken = [...Array(seatsData.length).keys()].filter((val) => !seatsTaken.includes(val))[
      Math.floor(Math.random() * (seatsData.length - seatsTaken.length))
      ];

    const newSeatsTaken = swap(seatsData, seatsTaken, distance, indexToDelete, newPlaceTaken);
    if (newSeatsTaken.length > seatsTaken.length) seatsTaken = newSeatsTaken;

    iteration++;
  }

  return seatsTaken;
}
