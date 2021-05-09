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
 * Shuffle an array randomly
 *
 * @param {[]} array The array to shuffle.
 * @returns {[]} The shuffled array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * The main algorithm to resolve, using genetic algorithm, the MSA problem.
 * This algorithm will create generation 0 randomly with maxTries attempts.
 * Then we calculate the score of every member of the current generation.
 * Based on this, we extract the best two (the parents).
 * We create a new population based at 75% on the previous best two (the parents).
 * We then mutate each member of the new population by removing 1 to 3 seatsTaken. Odds are :
 *    - 100 % - Remove 1
 *    - 25% - Remove 2
 *    - 0.625% - Remove 3
 *
 * Then, we try to add as many as possible new seatTaken.
 * And we loop until we met generationMax.
 *
 * @param {[{name: String, x: Number, y: Number}]} seatsData The seats configuration
 * @param {Number} distance The minimum distance between each seats
 * @param {Number} maxTries The number of tries for the initial population
 * @param {Number} populationSize The size of the population
 * @param {Number} generationMax The number of generation
 * @returns {Number[]} An array with the index of the occupied seat based on "seatsData"
 */
function genetic(seatsData, distance, maxTries, populationSize, generationMax) {
  let generation = 0;
  let population = [];

  let bestTwo = [null, null];

  // Init population
  for (let i = 0; i < populationSize; i++) {
    let freePlaces = [...Array(seatsData.length).keys()];
    shuffleArray(freePlaces);
    const takenPlace = [freePlaces[0]];
    freePlaces.splice(0, 1);

    let tries = 0;
    while (tries < maxTries || takenPlace.length < 3) {
      shuffleArray(freePlaces);
      const randomPlace = freePlaces[0];

      let inRange = false;
      for (let j = 0; j < takenPlace.length; j++) {
        if (isInRange(seatsData[randomPlace], seatsData[takenPlace[j]], distance)) {
          inRange = true;
          break;
        }
      }

      if (!inRange) {
        takenPlace.push(randomPlace);
        freePlaces.splice(0, 1);
      } else {
        tries++;
      }
    }

    population[i] = takenPlace.slice();
  }

  while (generation < generationMax) {
    // Score calculation
    for (let i = 0; i < populationSize; i++) {
      for (let j = 0; j < 2; j++) {
        if (!bestTwo[j] || population[i].length > bestTwo[j].length) {
          bestTwo[j] = population[i].slice();
          break;
        }
      }
    }

    const commonPlacesOfParents = [...Array(seatsData.length).keys()].filter(
      (x) => bestTwo[0].includes(x) && bestTwo[1].includes(x)
    );

    // Create new population, mutate and compute
    for (let i = 0; i < populationSize; i++) {
      // Create new population
      shuffleArray(commonPlacesOfParents);
      population[i] = commonPlacesOfParents.slice(0, Math.floor((commonPlacesOfParents.length - 1) * 0.75));

      // Mutating
      population[i].splice(Math.floor(Math.random() * (population[i].length - 1)), 1);
      const rng = Math.random();
      if (rng > 0.75) {
        population[i].splice(Math.floor(Math.random() * (population[i].length - 1)), 1);
        if (rng > 0.975) {
          population[i].splice(Math.floor(Math.random() * (population[i].length - 1)), 1);
        }
      }

      // Computing
      let firstCompute = true;
      let freePlaces = [];
      let potentialFreeTakenPlaces = [];

      while (potentialFreeTakenPlaces.length > 0 || firstCompute) {
        if (firstCompute) {
          firstCompute = false;
        } else {
          population[i].push(potentialFreeTakenPlaces[0]);
        }

        freePlaces = [...Array(seatsData.length).keys()].filter((val) => !population[i].includes(val));
        potentialFreeTakenPlaces = [];

        for (let j = 0; j < freePlaces.length; j++) {
          let inRange = false;
          for (let k = 0; k < population[i].length; k++) {
            if (isInRange(seatsData[j], seatsData[population[i][k]], distance)) {
              inRange = true;
              break;
            }
          }
          if (!inRange) potentialFreeTakenPlaces.push(j);
        }
        shuffleArray(potentialFreeTakenPlaces);
      }
    }

    generation++;
  }
  return bestTwo[0];
}
