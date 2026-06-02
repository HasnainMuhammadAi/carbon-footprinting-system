// ============================================================
// faceAuthRoutes.js
// Place in: carbon-backend/routes/faceAuthRoutes.js
// ============================================================

const express    = require('express');
const router     = express.Router();
const faceCtrl   = require('../controllers/faceAuthController');
const { verifyJWT } = require('../middleware/authMiddleware');

// Public — no token needed
router.post('/face-login', faceCtrl.faceLogin);

// Protected — user must be logged in with password first to enroll face
router.post('/face-enroll', verifyJWT, faceCtrl.enrollFace);

module.exports = router;
