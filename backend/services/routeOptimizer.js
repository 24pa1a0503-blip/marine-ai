function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function getNeighbors(cell, grid) {
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  const neighbors = [];

  for (const [dr, dc] of directions) {
    const row = cell.row + dr;
    const col = cell.col + dc;

    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      neighbors.push({ row, col });
    }
  }

  return neighbors;
}

function cellKey(cell) {
  return `${cell.row},${cell.col}`;
}

function isRestricted(cell, restrictedCells) {
  return restrictedCells.some(
    (restricted) => restricted.row === cell.row && restricted.col === cell.col,
  );
}

function reconstructPath(cameFrom, current) {
  const path = [current];

  while (cameFrom.has(cellKey(current))) {
    current = cameFrom.get(cellKey(current));
    path.push(current);
  }

  return path.reverse();
}

// ========================================
// HAZARD ANALYSIS
// ========================================

function getAvoidedHazards(grid, route, restrictedCells) {
  const routeKeys = new Set(route.map(cellKey));
  const avoided = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = { row, col };

      // Restricted zone
      if (isRestricted(cell, restrictedCells)) {
        avoided.push({
          type: "RESTRICTED_ZONE",
          row,
          col,
          message: "Restricted zone avoided",
        });

        continue;
      }

      // High-risk cells not used by route
      if (!routeKeys.has(cellKey(cell))) {
        const riskCost = grid[row][col];

        if (riskCost >= 50) {
          avoided.push({
            type: "EXTREME_RISK",
            row,
            col,
            riskCost,
            message: "Extreme-risk cell avoided",
          });
        } else if (riskCost >= 20) {
          avoided.push({
            type: "HIGH_RISK",
            row,
            col,
            riskCost,
            message: "High-risk cell avoided",
          });
        }
      }
    }
  }

  return avoided;
}

// ========================================
// MAIN A* ROUTE OPTIMIZER
// ========================================

function optimizeRoute(
  grid,
  start,
  goal,
  restrictedCells = [],
  marineRisk = null,
) {
  // ========================================
  // VALIDATE GRID
  // ========================================

  if (!Array.isArray(grid) || grid.length === 0) {
    return {
      success: false,
      message: "Invalid grid",
    };
  }

  if (!Array.isArray(grid[0]) || grid[0].length === 0) {
    return {
      success: false,
      message: "Invalid grid",
    };
  }

  const columns = grid[0].length;

  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== columns) {
      return {
        success: false,
        message: "Grid must be rectangular",
      };
    }
  }

  // ========================================
  // VALIDATE START
  // ========================================

  if (
    !start ||
    !Number.isInteger(start.row) ||
    !Number.isInteger(start.col) ||
    start.row < 0 ||
    start.row >= grid.length ||
    start.col < 0 ||
    start.col >= columns
  ) {
    return {
      success: false,
      message: "Invalid start position",
    };
  }

  // ========================================
  // VALIDATE GOAL
  // ========================================

  if (
    !goal ||
    !Number.isInteger(goal.row) ||
    !Number.isInteger(goal.col) ||
    goal.row < 0 ||
    goal.row >= grid.length ||
    goal.col < 0 ||
    goal.col >= columns
  ) {
    return {
      success: false,
      message: "Invalid destination position",
    };
  }

  // ========================================
  // RESTRICTED START / GOAL
  // ========================================

  if (isRestricted(start, restrictedCells)) {
    return {
      success: false,
      message: "Start position is restricted",
    };
  }

  if (isRestricted(goal, restrictedCells)) {
    return {
      success: false,
      message: "Destination is restricted",
    };
  }

  // ========================================
  // A* INITIALIZATION
  // ========================================

  const openSet = [start];

  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  gScore.set(cellKey(start), 0);
  fScore.set(cellKey(start), heuristic(start, goal));

  // ========================================
  // A* SEARCH
  // ========================================

  while (openSet.length > 0) {
    openSet.sort(
      (a, b) =>
        (fScore.get(cellKey(a)) ?? Infinity) -
        (fScore.get(cellKey(b)) ?? Infinity),
    );

    const current = openSet.shift();

    // ========================================
    // GOAL REACHED
    // ========================================

    if (current.row === goal.row && current.col === goal.col) {
      const route = reconstructPath(cameFrom, current);

      let totalRiskCost = 0;

      for (const cell of route) {
        totalRiskCost += grid[cell.row][cell.col];
      }

      const distance = route.length - 1;

      const totalCost = distance + totalRiskCost;

      const avoidedHazards = getAvoidedHazards(grid, route, restrictedCells);

      // ========================================
      // EXPLANATION
      // ========================================

      let explanation;

      if (marineRisk) {
        if (avoidedHazards.length > 0) {
          explanation =
            `Route selected to reduce exposure to ${marineRisk.level.toLowerCase()} marine conditions. ` +
            `${avoidedHazards.length} hazardous or restricted cells were avoided.`;
        } else {
          explanation = `Route selected based on ${marineRisk.level.toLowerCase()} marine conditions while minimizing travel distance.`;
        }
      } else {
        explanation =
          "Route selected by balancing travel distance and marine risk.";
      }

      // ========================================
      // FINAL RESPONSE
      // ========================================

      const response = {
        success: true,

        route,

        distance,

        totalRiskCost,

        totalCost,

        explanation,

        avoidedHazards,
      };

      // Add marine risk only when supplied
      if (marineRisk) {
        response.marineRisk = {
          score: marineRisk.score,
          level: marineRisk.level,
          factors: marineRisk.factors,
        };
      }

      return response;
    }

    // ========================================
    // CHECK NEIGHBORS
    // ========================================

    const neighbors = getNeighbors(current, grid);

    for (const neighbor of neighbors) {
      // Never enter restricted cells
      if (isRestricted(neighbor, restrictedCells)) {
        continue;
      }

      const neighborKey = cellKey(neighbor);

      const movementCost = 1;

      const riskCost = grid[neighbor.row][neighbor.col];

      const tentativeG =
        (gScore.get(cellKey(current)) ?? Infinity) + movementCost + riskCost;

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, current);

        gScore.set(neighborKey, tentativeG);

        fScore.set(neighborKey, tentativeG + heuristic(neighbor, goal));

        if (!openSet.some((cell) => cellKey(cell) === neighborKey)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // ========================================
  // NO SAFE ROUTE
  // ========================================

  return {
    success: false,
    message: "No safe route found",
  };
}

module.exports = {
  optimizeRoute,
};
