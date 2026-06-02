const express = require('express');
const router  = express.Router();
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const {
  getAllStorage,
  createStorage,
  deleteStorage,
} = require('../controllers/storageController');

const storageAccess = [verifyJWT, requireRole('owner', 'storage_admin')];

// GET    /api/storage
router.get('/',       ...storageAccess, getAllStorage);

// POST   /api/storage
router.post('/',      ...storageAccess, createStorage);

// DELETE /api/storage/:id
router.delete('/:id', ...storageAccess, deleteStorage);

module.exports = router;
