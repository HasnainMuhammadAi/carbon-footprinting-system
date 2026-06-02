const express = require('express');
const router  = express.Router();
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const { getOwnerReport, getMonthlyReport } = require('../controllers/reportsController');

const ownerOnly = [verifyJWT, requireRole('owner')];

// GET /api/reports/owner?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/owner',   ...ownerOnly, getOwnerReport);

// GET /api/reports/monthly?year=2024
router.get('/monthly', ...ownerOnly, getMonthlyReport);

module.exports = router;
