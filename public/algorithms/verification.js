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
      };
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
 * The main algorithm to verify if the configuration works.
 * The algorithm will check if each taken seats is not in range of another taken seat.
 *
 * @param {[{name: String, x: Number, y: Number}]} seats The seats configuration
 * @param {[Number]} takenSeats An array with the taken seats based on "seats"
 * @param {Number} distance The minimum distance between each seats
 * @return {boolean} Returns true if the configuration respect the constraints.
 */
function verify(seats, takenSeats, distance) {
  for (let i = 0; i < takenSeats.length - 1; i++) {
    for (let j = i + 1; j < takenSeats.length; j++) {
      if (isInRange(seats[takenSeats[i]], seats[takenSeats[j]], distance)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * The main function
 *
 * @param {String} dataString The input string
 * @param {[Number]} takenSeat An array with the taken seats based on "dataString"
 * @param {Number} distance The minimum distance between each seats
 * @return {{result: Boolean, time: number}} An array with the index of the occupued seat based on "seats"
 */
function main(dataString, takenSeat, distance) {
  const formattedString = importSeatsData(dataString);
  const timeStart = Date.now();
  const result = verify(formattedString, takenSeat, distance);
  return {
    time: Date.now() - timeStart,
    result: result
  };
}

