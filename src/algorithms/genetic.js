import { isInRange, shuffleArray } from "./helpers";
import { SEAT_DEFAULT_COLOR, SEAT_OBSTRUCTED_COLOR, SEAT_TAKEN_COLOR } from "../globals";

export function genetic(seatsData, distance, maxTries, populationSize, generationMax) {
  const timeStart = Date.now();
  realGenetic(seatsData, distance, maxTries, populationSize, generationMax);
  const time = Date.now() - timeStart;

  let arrowSteps = [];
  let colorSteps = [];
  let colorKey = Array(seatsData.length).fill(SEAT_DEFAULT_COLOR);

  let generation = 0;
  let population = [];
  let bestTwo = [null, null];

  for (let i = 0; i < populationSize; i++) {
    let freePlaces = [...Array(seatsData.length).keys()];
    shuffleArray(freePlaces);

    arrowSteps.push(null);
    colorKey = Array(seatsData.length).fill(SEAT_DEFAULT_COLOR);
    colorSteps.push(colorKey.slice());

    const takenPlace = [freePlaces[0]];
    freePlaces.splice(0, 1);

    arrowSteps.push(null);
    colorKey[takenPlace[0]] = SEAT_TAKEN_COLOR;
    colorSteps.push(colorKey.slice());

    let tries = 0;
    while (tries < maxTries || takenPlace.length < 3) {
      shuffleArray(freePlaces);
      const randomPlace = freePlaces[0];

      arrowSteps.push(null);
      colorKey[randomPlace] = SEAT_TAKEN_COLOR;
      colorSteps.push(colorKey.slice());

      let inRange = false;
      for (let j = 0; j < takenPlace.length; j++) {
        if (isInRange(seatsData[randomPlace], seatsData[takenPlace[j]], distance)) {
          inRange = true;

          arrowSteps.push({
            ax: seatsData[randomPlace].x,
            ay: seatsData[randomPlace].y,
            bx: seatsData[takenPlace[j]].x,
            by: seatsData[takenPlace[j]].y,
            color: SEAT_OBSTRUCTED_COLOR,
          });
          colorKey[randomPlace] = SEAT_OBSTRUCTED_COLOR;
          colorSteps.push(colorKey.slice());
          break;
        }
        arrowSteps.push({
          ax: seatsData[randomPlace].x,
          ay: seatsData[randomPlace].y,
          bx: seatsData[takenPlace[j]].x,
          by: seatsData[takenPlace[j]].y,
          color: SEAT_TAKEN_COLOR,
        });
        colorSteps.push(colorKey.slice());
      }

      if (!inRange) {
        takenPlace.push(randomPlace);
        freePlaces.splice(0, 1);

        arrowSteps.push(null);
        colorSteps.push(colorKey.slice());
      } else {
        arrowSteps.push(null);
        colorKey[randomPlace] = SEAT_DEFAULT_COLOR;
        colorSteps.push(colorKey.slice());

        tries++;
      }
    }

    population[i] = takenPlace.slice();
  }

  while (generation < generationMax) {
    for (let i = 0; i < populationSize; i++) {
      for (let j = 0; j < 2; j++) {
        if (!bestTwo[j] || population[i].length > bestTwo[j].length) {
          bestTwo[j] = population[i].slice();
          break;
        }
      }
    }

    for (let i = 0; i < bestTwo.length; i++) {
      colorKey = [...Array(seatsData.length).keys()].map((_, index) =>
        bestTwo[i].includes(index) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
      );
      arrowSteps.push(null);
      colorSteps.push(colorKey.slice());
    }

    const commonPlacesOfParents = [...Array(seatsData.length).keys()].filter(
      (x) => bestTwo[0].includes(x) && bestTwo[1].includes(x)
    );

    colorKey = [...Array(seatsData.length).keys()].map((_, index) =>
      commonPlacesOfParents.includes(index) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
    );
    arrowSteps.push(null);
    colorSteps.push(colorKey.slice());

    for (let i = 0; i < populationSize; i++) {
      shuffleArray(commonPlacesOfParents);
      population[i] = commonPlacesOfParents.slice(0, Math.floor((commonPlacesOfParents.length - 1) * 0.75));

      colorKey = [...Array(seatsData.length).keys()].map((_, index) =>
        population[i].includes(index) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
      );
      arrowSteps.push(null);
      colorSteps.push(colorKey.slice());

      population[i].splice(Math.floor(Math.random() * (population.length - 1)), 1);

      colorKey = [...Array(seatsData.length).keys()].map((_, index) =>
        population[i].includes(index) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
      );
      arrowSteps.push(null);
      colorSteps.push(colorKey.slice());

      const rng = Math.random();
      if (rng > 0.75) {
        population[i].splice(Math.floor(Math.random() * (population[i].length - 1)), 1);

        colorKey = [...Array(seatsData.length).keys()].map((_, index) =>
          population[i].includes(index) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
        );
        arrowSteps.push(null);
        colorSteps.push(colorKey.slice());
        if (rng > 0.975) {
          population[i].splice(Math.floor(Math.random() * (population[i].length - 1)), 1);

          colorKey = [...Array(seatsData.length).keys()].map((_, index) =>
            population[i].includes(index) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
          );
          arrowSteps.push(null);
          colorSteps.push(colorKey.slice());
        }
      }

      let firstCompute = true;
      let freePlaces = [];
      let potentialFreeTakenPlaces = [];

      while (potentialFreeTakenPlaces.length > 0 || firstCompute) {
        if (firstCompute) {
          firstCompute = false;
        } else {
          population[i].push(potentialFreeTakenPlaces[0]);

          arrowSteps.push(null);
          colorKey[potentialFreeTakenPlaces[0]] = SEAT_TAKEN_COLOR;
          colorSteps.push(colorKey.slice());
        }

        freePlaces = [...Array(seatsData.length).keys()].filter((val) => !population[i].includes(val));
        potentialFreeTakenPlaces = [];

        arrowSteps.push(null);
        colorKey = [...Array(seatsData.length).keys()].map((_, index) =>
          population[i].includes(index) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
        );
        colorSteps.push(colorKey.slice());

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

  colorKey = [...Array(seatsData.length).keys()].map((_, index) =>
    bestTwo[0].includes(index) ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR
  );
  arrowSteps.push(null);
  colorSteps.push(colorKey.slice());

  return [arrowSteps, colorSteps, time, null];
}

function realGenetic(seatsData, distance, maxTries, populationSize, generationMax) {
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
