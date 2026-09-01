const calculateRisk = require("./riskCalculator");

const marineData = {
  windSpeed: 35,
  waveHeight: 3.5,
  rainProbability: 90,
  lightning: true,
  cyclone: true,
};

const result = calculateRisk(marineData);

console.log(result);
