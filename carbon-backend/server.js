require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes      = require('./routes/auth');
const faceAuthRoutes  = require('./routes/faceAuthRoutes');
const farmingRoutes   = require('./routes/farming');
const transportRoutes = require('./routes/transport');
const storageRoutes   = require('./routes/storage');
const packagingRoutes = require('./routes/packaging');
const reportsRoutes   = require('./routes/reports');
const farmsRoutes     = require('./routes/farms');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth',      authRoutes);
app.use('/api/auth',      faceAuthRoutes);   // ← face login/enroll
app.use('/api/farms',     farmsRoutes);
app.use('/api/farming',   farmingRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/storage',   storageRoutes);
app.use('/api/packaging', packagingRoutes);
app.use('/api/reports',   reportsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀  Carbon backend running on http://localhost:${PORT}`);
});

module.exports = app;
