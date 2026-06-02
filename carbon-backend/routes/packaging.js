const express = require('express');
const router  = express.Router();
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const {
  getAllPackaging,
  createPackaging,
  deletePackaging,
} = require('../controllers/packagingController');

const packagingAccess = [verifyJWT, requireRole('owner', 'packaging_admin')];

// GET    /api/packaging
router.get('/',       ...packagingAccess, getAllPackaging);

// POST   /api/packaging
router.post('/',      ...packagingAccess, createPackaging);

// DELETE /api/packaging/:id
router.delete('/:id', ...packagingAccess, deletePackaging);

module.exports = router;
