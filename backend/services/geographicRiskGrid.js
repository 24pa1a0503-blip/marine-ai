const { calculateRisk } = require("../../risk-engine/riskCalculator");
const { getRiskCost } = require("../../risk-engine/riskCost");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createGeographicRiskGrid({
  rows,
  cols,
  start,
  destination,
  marineConditions,
  hazardCells = [],
}) {
  if (!Number.isInteger(rows) || rows <= 0) {
    throw new Error("Rows must be a positive integer");
  }

  if (!Number.isInteger(cols) || cols <= 0) {
    throw new Error("Columns must be a positive integer");
  }

  if (!start || !destination) {
    throw new Error("Start and destination are required");
  }

  const startLat = Number(start.latitude);
  const startLon = Number(start.longitude);

  const endLat = Number(destination.latitude);
  const endLon = Number(destination.longitude);

  if (
    !Number.isFinite(startLat) ||
    !Number.isFinite(startLon) ||
    !Number.isFinite(endLat) ||
    !Number.isFinite(endLon)
  ) {
    throw new Error("Invalid geographic coordinates");
  }

  const riskResult = calculateRisk(marineConditions);

  const baseRiskCost = getRiskCost(riskResult.level);

  const wind = Number(marineConditions.wind) || 0;
  const waveHeight = Number(marineConditions.waveHeight) || 0;
  const rainProbability = Number(marineConditions.rainProbability) || 0;
  const lightning = Number(marineConditions.lightning) || 0;

  /*
   * Ocean current is not directly used by the existing
   * risk calculator, so we include it as an additional
   * prototype route-cost factor.
   */
  const currentSpeed = Number(marineConditions.currentSpeed) || 0;

  const grid = [];
  const coordinates = [];

  for (let row = 0; row < rows; row++) {
    const gridRow = [];
    const coordinateRow = [];

    const latRatio = rows === 1 ? 0 : row / (rows - 1);

    for (let col = 0; col < cols; col++) {
      const lonRatio = cols === 1 ? 0 : col / (cols - 1);

      const latitude = startLat + (endLat - startLat) * latRatio;

      const longitude = startLon + (endLon - startLon) * lonRatio;

      /*
       * Start with the overall environmental risk.
       */
      let cellRisk = baseRiskCost;

      /*
       * Wind contribution.
       */
      if (wind >= 35) {
        cellRisk += 15;
      } else if (wind >= 25) {
        cellRisk += 8;
      } else if (wind >= 15) {
        cellRisk += 3;
      }

      /*
       * Wave contribution.
       */
      if (waveHeight >= 4) {
        cellRisk += 15;
      } else if (waveHeight >= 2.5) {
        cellRisk += 8;
      } else if (waveHeight >= 1.5) {
        cellRisk += 3;
      }

      /*
       * Rain contribution.
       */
      if (rainProbability >= 80) {
        cellRisk += 10;
      } else if (rainProbability >= 60) {
        cellRisk += 5;
      }

      /*
       * Lightning warning contribution.
       */
      if (lightning >= 3) {
        cellRisk += 15;
      } else if (lightning >= 1) {
        cellRisk += 8;
      }

      /*
       * Ocean-current contribution.
       */
      if (currentSpeed >= 1.5) {
        cellRisk += 8;
      } else if (currentSpeed >= 1.0) {
        cellRisk += 4;
      }

      /*
       * Geographic variation.
       *
       * This prevents the prototype grid from being
       * completely uniform when all environmental
       * observations come from a single coordinate.
       */

      /*
       * Explicit test/demo hazards override the
       * calculated environmental cost.
       */
      const hazard = hazardCells.find(
        (item) => item.row === row && item.col === col,
      );

      if (hazard) {
        cellRisk = hazard.riskCost;
      }

      /*
       * Keep risk costs in a reasonable range.
       */
      cellRisk = clamp(Math.round(cellRisk), 1, 50);

      gridRow.push(cellRisk);

      coordinateRow.push({
        row,
        col,
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        riskCost: cellRisk,
      });
    }

    grid.push(gridRow);
    coordinates.push(coordinateRow);
  }

  return {
    grid,
    coordinates,

    risk: {
      score: riskResult.score,
      level: riskResult.level,
      factors: riskResult.factors,
      riskCost: baseRiskCost,
    },
  };
}

module.exports = {
  createGeographicRiskGrid,
};
