# API Contract

## GET /api/health

Response:

{
"status": "ok"
}

## GET /api/pfz/nearby

Query:

lat
lon

Response:

{
"pfz": [
{
"id": "PFZ001",
"lat": 16.82,
"lon": 82.62
}
]
}

## POST /api/risk

Request:

{
"windSpeed": 18,
"waveHeight": 1.4,
"rainProbability": 30,
"lightning": false,
"cyclone": false
}

Response:

{
"score": 40,
"level": "MODERATE",
"factors": []
}

# Marine AI API Contract

## Health

GET /api/health

Response:

{
"status": "ok",
"message": "Marine AI backend is running"
}

---

## Marine Risk

POST /api/marine/risk

Request:

{
"windSpeed": 25,
"waveHeight": 2.4,
"rainProbability": 70,
"lightning": true,
"cyclone": false
}

Response:

{
"score": 80,
"level": "HIGH",
"factors": [
"High wind speed",
"High wave height",
"Lightning detected"
]
}
