const THRESHOLDS = {
  wind: {
    low: 15,
    moderate: 25,
    high: 35,
  },

  windGust: {
    low: 25,
    moderate: 35,
    high: 45,
  },

  waveHeight: {
    low: 1.5,
    moderate: 2.5,
    high: 4.0,
  },

  rainProbability: {
    low: 30,
    moderate: 60,
    high: 80,
  },

  lightning: {
    low: 0,
    moderate: 1,
    high: 3,
  },
};

module.exports = THRESHOLDS;
