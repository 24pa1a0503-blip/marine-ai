const { calculateRisk } = require("../../../risk-engine/riskCalculator");

function getMarineRisk(req, res) {
  try {
    const {
      windSpeed,
      waveHeight,
      rainProbability,
      lightning,
      cyclone
    } = req.body;

    // Validate required inputs
    if (
      windSpeed === undefined ||
      waveHeight === undefined ||
      rainProbability === undefined ||
      lightning === undefined ||
      cyclone === undefined
    ) {
      return res.status(400).json({
        error: "Missing required marine weather/ocean parameters"
      });
    }

    // Convert API field names to risk-engine field names
    const result = calculateRisk({
      wind: Number(windSpeed),
      waveHeight: Number(waveHeight),
      rainProbability: Number(rainProbability),
      lightning: Number(lightning),
      cyclone: Boolean(cyclone)
    });

    res.json({
      success: true,
      risk: result
    });

  } catch (error) {
    console.error("Risk calculation error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to calculate marine risk"
    });
  }
}

module.exports = {
  getMarineRisk
};