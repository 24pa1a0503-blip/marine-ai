const calculateRisk = require("../../../risk-engine/riskCalculator");

function getMarineRisk(req, res) {
  try {
    const { windSpeed, waveHeight, rainProbability, lightning, cyclone } =
      req.body;

    const result = calculateRisk({
      windSpeed,
      waveHeight,
      rainProbability,
      lightning,
      cyclone,
    });

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to calculate marine risk",
    });
  }
}

module.exports = {
  getMarineRisk,
};
