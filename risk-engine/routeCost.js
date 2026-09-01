function calculateRouteCost(riskValue) {
  if (riskValue === 999) {
    return Infinity;
  }

  return riskValue;
}

module.exports = calculateRouteCost;
