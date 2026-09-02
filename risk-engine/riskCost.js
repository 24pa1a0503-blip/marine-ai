const RISK_COST = {
  LOW: 1,
  MODERATE: 5,
  HIGH: 20,
  EXTREME: 50,
  RESTRICTED: Infinity,
};

function getRiskCost(level, restricted = false) {
  if (restricted) {
    return RISK_COST.RESTRICTED;
  }

  return RISK_COST[level] ?? RISK_COST.EXTREME;
}

module.exports = {
  RISK_COST,
  getRiskCost,
};
