const express = require('express');
const router  = express.Router();
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const {
  getAllFarming,
  createFarming,
  deleteFarming,
} = require('../controllers/farmingController');

const farmingAccess = [verifyJWT, requireRole('owner', 'farming_admin')];

// GET    /api/farming
router.get('/',    ...farmingAccess, getAllFarming);

// POST   /api/farming
router.post('/',   ...farmingAccess, createFarming);

// DELETE /api/farming/:id
router.delete('/:id', ...farmingAccess, deleteFarming);

module.exports = router;
