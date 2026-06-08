# 🌿 CampusEats — Smart Campus Food Waste Reduction Platform

> Reducing university cafeteria food waste by **30–40%** through real-time IoT tracking, predictive analytics, and actionable dashboards.

## 🚨 Problem Statement

University cafeterias generate significant food waste every day — with little visibility into **which dishes are over-produced**, **when peak demand occurs**, or **how much is wasted per meal**. This leads to:

- 💸 Unnecessary financial losses (~$2.5 per kg of wasted food)
- 🌍 Environmental harm (landfill and carbon emissions)
- 😔 Missed opportunities to redirect surplus food to students in need

**CampusEats** solves this by providing real-time food waste tracking and ML-powered demand forecasting for campus dining operations — helping managers make data-driven decisions and reduce waste by an estimated **30–40%**.

---

## 🏗️ System Architecture

![System Diagram](docs/system_diagram.svg)

| Layer | Technology |
|-------|-----------|
| Frontend (Web) | React.js, Tailwind CSS |
| Frontend (Mobile) | React Native (iOS & Android) |
| Backend / API | Python, FastAPI, asyncpg |
| Database | PostgreSQL, Redis |
| IoT Integration | MQTT, Raspberry Pi (smart scales) |
| ML / Analytics | Python, scikit-learn, FastAPI |
| Cloud / DevOps | AWS (EC2, S3), Docker, GitHub Actions |

---

## ✨ Features

- **📊 Real-time Dashboard** — live waste metrics, cost estimates, and trend charts
- **⚖️ IoT Scale Integration** — Raspberry Pi smart scales push data via MQTT protocol
- **🤖 ML Demand Forecast** — Random Forest model predicts meal demand for the next 7 days
- **🔔 Smart Alerts** — anomaly detection triggers automatic alerts for waste spikes
- **📈 Analytics** — weekly trends, peak hours heatmap, top-wasted meals breakdown
- **🔐 Role-Based Access** — Admin / Manager / Staff roles with JWT authentication

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local dev)
- Python 3.11+ (for ML service)

### Run with Docker

```bash
git clone https://github.com/yakubka/food_waste_reduction.git
cd food_waste_reduction
cp .env.example .env   # edit values
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web Dashboard | http://localhost:3000 |
| API | http://localhost:3001 |
| ML Service | http://localhost:8000/docs |

### Local Backend Development

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
uvicorn main:app --reload --port 3001
```

Interactive API docs available at **http://localhost:3001/api/docs**

### Local Frontend Development

```bash
cd frontend
npm install
npm start
```

### Train the ML Model

```bash
cd ml
pip install -r requirements.txt
python train.py          # trains on DB data
uvicorn predict_api:app --port 8000   # serves predictions
```

---

## 📁 Project Structure

```
campuseats/
├── backend/
│   └── src/
│       ├── routes/          # auth, waste, meals, analytics, alerts
│       ├── middleware/       # JWT auth, error handler
│       ├── config/          # DB, logger, SQL schema
│       └── services/        # MQTT IoT ingestion
├── frontend/
│   └── src/
│       ├── pages/           # Dashboard, WasteLogs, Analytics, Meals, Alerts, Login
│       ├── components/      # Layout, shared UI
│       └── services/        # API client, Zustand auth store
├── ml/
│   ├── train.py             # Random Forest training script
│   └── predict_api.py       # FastAPI prediction endpoint
├── docs/
│   └── system_diagram.svg   # Architecture diagram
├── .github/workflows/ci.yml # CI/CD pipeline
└── docker-compose.yml
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/waste` | List waste logs |
| POST | `/api/waste` | Log a waste entry |
| GET | `/api/waste/summary/daily` | Daily waste summary |
| GET | `/api/meals` | List meals |
| GET | `/api/analytics/overview` | 30-day stats |
| GET | `/api/analytics/demand-forecast` | 7-day ML forecast |
| GET | `/api/alerts` | Get alerts |

---

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# ML tests
cd ml && pytest tests/ -v
```

---

## 🤝 Implementation Timeline

| Phase | Weeks | Description |
|-------|-------|-------------|
| Research & Requirements | 1–2 | Interviews, stack finalization |
| System Design | 3–4 | Architecture, DB schema, wireframes |
| Core Development | 5–8 | Backend API, DB, IoT, Mobile app |
| ML / Analytics | 9–10 | Demand prediction, anomaly detection |
| Testing & Deployment | 11–12 | UAT, pilot rollout, AWS deployment |

---

## 👥 Team

Built for **Introduction to Software Engineering — Spring 2026** using Claude AI (claude.ai).

---

## 📜 License

MIT
