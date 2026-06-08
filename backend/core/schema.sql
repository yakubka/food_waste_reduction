-- CampusEats Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE cafeterias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  location    TEXT,
  capacity    INT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('admin','manager','staff')),
  cafeteria_id   UUID REFERENCES cafeterias(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  category          TEXT NOT NULL CHECK (category IN ('breakfast','lunch','dinner','snack')),
  cafeteria_id      UUID REFERENCES cafeterias(id),
  serving_size_g    INT NOT NULL,
  cost_per_serving  NUMERIC(8,2),
  description       TEXT,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE waste_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id       UUID NOT NULL REFERENCES meals(id),
  cafeteria_id  UUID NOT NULL REFERENCES cafeterias(id),
  weight_kg     NUMERIC(8,3) NOT NULL CHECK (weight_kg >= 0),
  logged_by     UUID REFERENCES users(id),
  source        TEXT NOT NULL CHECK (source IN ('scale','manual')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafeteria_id  UUID REFERENCES cafeterias(id),
  type          TEXT NOT NULL CHECK (type IN ('spike','surplus','prediction')),
  severity      TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  message       TEXT NOT NULL,
  meal_id       UUID REFERENCES meals(id),
  is_read       BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE iot_readings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id     TEXT NOT NULL,
  cafeteria_id  UUID REFERENCES cafeterias(id),
  weight_kg     NUMERIC(8,3) NOT NULL,
  raw_payload   JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waste_logs_cafeteria ON waste_logs(cafeteria_id);
CREATE INDEX idx_waste_logs_created   ON waste_logs(created_at DESC);
CREATE INDEX idx_waste_logs_meal      ON waste_logs(meal_id);
CREATE INDEX idx_alerts_cafeteria     ON alerts(cafeteria_id);
CREATE INDEX idx_iot_device           ON iot_readings(device_id);
