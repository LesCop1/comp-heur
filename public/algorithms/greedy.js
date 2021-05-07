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
 * The main function
 *
 * @param {String} dataString The input string
 * @param {Number} distance The minimum distance between each seats
 * @return {{result: Number[], time: number}} An array with the index of the occupued seat based on "seats"
 */
function main(dataString, distance) {
    const formattedString = importSeatsData(dataString);
    const timeStart = Date.now();
    const result = greedy(formattedString, distance);
    return {
        time: Date.now() - timeStart,
        result: result,
        numberOfOccupiedSeats: result.length
    }
}
