const { calculateRisk } = require("./riskCalculator");

const conditions = {
  wind: 45,
  waveHeight: 5,
  rainProbability: 95,
  lightning: 5,
  cyclone: true,
};

console.log(calculateRisk(conditions));
