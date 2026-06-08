# CampusEats API Documentation

**Base URL:** `http://localhost:3001`
**Interactive Docs:** `http://localhost:3001/api/docs` (Swagger UI)
**ReDoc:** `http://localhost:3001/api/redoc`

All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Authentication

### POST `/api/auth/register`
Register a new user.

**Request body:**
```json
{
  "email": "manager@university.edu",
  "password": "securepass123",
  "name": "Ali Karimov",
  "role": "manager",
  "cafeteria_id": "uuid-optional"
}
```
> `role` must be one of: `admin` | `manager` | `staff`

**Response `201`:**
```json
{
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "manager@university.edu",
    "name": "Ali Karimov",
    "role": "manager"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
| Code | Reason |
|------|--------|
| `400` | Validation error (weak password, invalid email) |
| `409` | Email already registered |

---

### POST `/api/auth/login`
Authenticate and receive a JWT token.

**Request body:**
```json
{
  "email": "manager@university.edu",
  "password": "securepass123"
}
```

**Response `200`:**
```json
{
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "manager@university.edu",
    "name": "Ali Karimov",
    "role": "manager"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
| Code | Reason |
|------|--------|
| `401` | Invalid credentials |

---

## Waste Logs

### GET `/api/waste`
List waste log entries with optional filters. 🔒 Auth required.

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `cafeteria_id` | UUID | Filter by cafeteria |
| `from` | ISO date | Start date (`2026-01-01`) |
| `to` | ISO date | End date (`2026-06-01`) |
| `limit` | int (1–1000) | Max results (default: `100`) |

**Response `200`:**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "meal_id": "...",
    "cafeteria_id": "...",
    "weight_kg": 2.35,
    "source": "scale",
    "notes": null,
    "created_at": "2026-06-08T12:00:00Z",
    "meal_name": "Beef Pilaf",
    "category": "lunch"
  }
]
```

---

### POST `/api/waste`
Log a new waste entry (manual or from IoT scale). 🔒 Auth required.

**Request body:**
```json
{
  "meal_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "cafeteria_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "weight_kg": 1.5,
  "source": "manual",
  "notes": "Overproduced for Friday"
}
```
> `source` must be `scale` or `manual`
> `weight_kg` must be `> 0`

**Response `201`:** Returns the created waste log object.

---

### GET `/api/waste/summary/daily`
Aggregated daily waste for the last 30 days. 🔒 Auth required.

**Query params:** `cafeteria_id` (optional UUID)

**Response `200`:**
```json
[
  {
    "date": "2026-06-08T00:00:00Z",
    "total_kg": 12.4,
    "entries": 8,
    "avg_kg_per_entry": 1.55
  }
]
```

---

## Meals

### GET `/api/meals`
List all active meals. 🔒 Auth required.

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `cafeteria_id` | UUID | Filter by cafeteria |
| `category` | string | `breakfast` \| `lunch` \| `dinner` \| `snack` |

**Response `200`:**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Beef Pilaf",
    "category": "lunch",
    "cafeteria_id": "...",
    "serving_size_g": 350,
    "cost_per_serving": 2.50,
    "description": "Traditional Uzbek rice dish",
    "is_active": true,
    "created_at": "2026-06-01T08:00:00Z"
  }
]
```

---

### POST `/api/meals`
Create a new meal. 🔒 Requires `admin` or `manager` role.

**Request body:**
```json
{
  "name": "Beef Pilaf",
  "category": "lunch",
  "cafeteria_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "serving_size_g": 350,
  "cost_per_serving": 2.50,
  "description": "Traditional Uzbek rice dish"
}
```

**Response `201`:** Returns the created meal object.

**Errors:**
| Code | Reason |
|------|--------|
| `403` | Insufficient role (staff cannot create meals) |

---

### GET `/api/meals/{meal_id}/waste-trend`
Waste trend for a specific meal over the last 14 days. 🔒 Auth required.

**Response `200`:**
```json
[
  { "date": "2026-06-01", "total_waste_kg": 1.2 },
  { "date": "2026-06-02", "total_waste_kg": 0.8 }
]
```

---

## Analytics

### GET `/api/analytics/overview`
30-day waste overview with top meals and hourly breakdown. 🔒 Auth required.

**Query params:** `cafeteria_id` (optional UUID)

**Response `200`:**
```json
{
  "summary": {
    "total_waste_kg": 145.20,
    "avg_waste_per_entry": 1.82,
    "total_entries": 80,
    "estimated_cost_usd": 363.00
  },
  "top_waste_meals": [
    { "name": "Beef Pilaf", "waste_kg": 32.5 },
    { "name": "Chicken Soup", "waste_kg": 18.1 }
  ],
  "waste_by_hour": [
    { "hour": 12.0, "waste_kg": 45.3 },
    { "hour": 18.0, "waste_kg": 38.7 }
  ]
}
```

---

### GET `/api/analytics/demand-forecast`
ML-powered demand forecast for the next 7 days. 🔒 Auth required.

**Response `200`:**
```json
[
  { "date": "2026-06-09", "predicted_servings": 243, "confidence": 0.87 },
  { "date": "2026-06-10", "predicted_servings": 218, "confidence": 0.82 }
]
```

---

### GET `/api/analytics/reduction`
Weekly waste totals for the last 12 weeks (used for reduction trend chart). 🔒 Auth required.

**Response `200`:**
```json
[
  { "week": "2026-03-16T00:00:00Z", "total_kg": 98.4 },
  { "week": "2026-03-23T00:00:00Z", "total_kg": 87.1 }
]
```

---

## Alerts

### GET `/api/alerts`
List the latest 50 alerts. 🔒 Auth required.

**Query params:** `cafeteria_id` (optional UUID)

**Response `200`:**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "cafeteria_id": "...",
    "type": "spike",
    "severity": "high",
    "message": "Scale scale-01 reported 6.2 kg — possible waste spike",
    "is_read": false,
    "created_at": "2026-06-08T13:45:00Z"
  }
]
```

> `type`: `spike` | `surplus` | `prediction`
> `severity`: `low` | `medium` | `high`

---

### PATCH `/api/alerts/{alert_id}/read`
Mark an alert as read. 🔒 Auth required.

**Query params:** `cafeteria_id` (optional UUID)

**Response `200`:**
```json
{ "success": true }
```

**Errors:**
| Code | Reason |
|------|--------|
| `404` | Alert not found |

---

## Health Check

### GET `/health`
No auth required.

**Response `200`:**
```json
{ "status": "ok", "version": "1.0.0" }
```

---

## Error Format

All errors return a consistent JSON body:

```json
{ "detail": "Error message here" }
```

For validation errors (`422 Unprocessable Entity`):
```json
{
  "detail": [
    {
      "loc": ["body", "weight_kg"],
      "msg": "Input should be greater than 0",
      "type": "greater_than"
    }
  ]
}
```

---

## Authentication Flow

```
1. POST /api/auth/login  →  receive { token }
2. Store token in client
3. Send all requests with:
   Authorization: Bearer <token>
4. Token expires after 24 hours (JWT_EXPIRE_MINUTES=1440)
```

---

## IoT Scale Integration (MQTT)

Smart scales publish to topic `campuseats/scales/<device_id>`:

```json
{
  "weight_kg": 2.35,
  "cafeteria_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

The backend `mqtt_service.py` subscribes automatically on startup. If `weight_kg > 5`, a `high` severity alert is created automatically.
