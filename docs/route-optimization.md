# Marine AI Route Optimization

## Risk Costs

LOW = 1
MODERATE = 5
HIGH = 20
EXTREME = 50
RESTRICTED = Infinity

## Algorithm

A\* grid-based route optimization.

## Inputs

- Start cell
- Goal cell
- Risk grid
- Restricted cells

## Output

- Route coordinates
- Distance
- Total cost
- Risk level
- Avoided hazards/zones

## Safety Logic

Restricted cells are never included in a route.

## Prototype Limitation

This is a hackathon prototype and is not a legally
or safety-certified navigation system.
