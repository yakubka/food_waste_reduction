require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');

const authRoutes = require('./routes/auth');
const wasteRoutes = require('./routes/waste');
const mealsRoutes = require('./routes/meals');
const analyticsRoutes = require('./routes/analytics');
const alertsRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertsRoutes);

app.use(errorHandler);

app.listen(PORT, () => logger.info(`CampusEats API running on port ${PORT}`));

module.exports = app;
