const calculateRouteCost = require("./routeCost");

const route1 = [1, 1, 20, 1];
const route2 = [1, 1, 1, 1];

const cost1 = route1.reduce(
  (total, risk) => total + calculateRouteCost(risk),
  0,
);

const cost2 = route2.reduce(
  (total, risk) => total + calculateRouteCost(risk),
  0,
);

console.log("Route 1 cost:", cost1);
console.log("Route 2 cost:", cost2);

console.log("Recommended:", cost1 < cost2 ? "Route 1" : "Route 2");
