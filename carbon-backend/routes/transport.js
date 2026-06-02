const express = require('express');
const router  = express.Router();
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const {
  getAllTransport,
  createTransport,
  deleteTransport,
} = require('../controllers/transportController');

const transportAccess = [verifyJWT, requireRole('owner', 'transport_admin')];

// GET    /api/transport
router.get('/',       ...transportAccess, getAllTransport);

// POST   /api/transport
router.post('/',      ...transportAccess, createTransport);

// DELETE /api/transport/:id
router.delete('/:id', ...transportAccess, deleteTransport);

module.exports = router;
