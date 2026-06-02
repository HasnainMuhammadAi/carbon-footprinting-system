// ============================================================
// faceAuthController.js
// Place in: carbon-backend/controllers/faceAuthController.js
// ============================================================

const db  = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Euclidean distance between two 128-dim descriptors
function euclideanDistance(a, b) {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

// ── POST /api/auth/face-enroll ───────────────────────────────
// Requires: valid JWT (verifyJWT middleware)
// Body: { descriptor: [128 floats] }
exports.enrollFace = async (req, res) => {
  try {
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid face descriptor. Must be array of 128 numbers.' });
    }

    const userId = req.user.userId; // matches your middleware: req.user = { userId, role }

    await db.query(
      'UPDATE users SET face_descriptor = ? WHERE user_id = ?',
      [JSON.stringify(descriptor), userId]
    );

    res.json({ message: 'Face enrolled successfully.' });
  } catch (err) {
    console.error('face-enroll error:', err);
    res.status(500).json({ message: 'Server error during face enrollment.' });
  }
};

// ── POST /api/auth/face-login ────────────────────────────────
// Public endpoint — no JWT needed
// Body: { descriptor: [128 floats] }
exports.faceLogin = async (req, res) => {
  try {
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid face descriptor.' });
    }

    // Fetch all users who have enrolled a face
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, role, is_active, face_descriptor FROM users WHERE face_descriptor IS NOT NULL AND face_descriptor != ""'
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'No faces enrolled yet.' });
    }

    const THRESHOLD = 0.5;
    let bestMatch   = null;
    let bestDistance = Infinity;

    for (const user of rows) {
      const stored = JSON.parse(user.face_descriptor);
      const dist   = euclideanDistance(descriptor, stored);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestMatch    = user;
      }
    }

    if (!bestMatch || bestDistance > THRESHOLD) {
      return res.status(401).json({ message: 'Face not recognised. Please use password login.' });
    }

    if (!bestMatch.is_active) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    // Issue JWT — same structure as your authController login
    const token = jwt.sign(
      { userId: bestMatch.user_id, role: bestMatch.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Face login successful.',
      token,
      user: {
        userId:   bestMatch.user_id,
        fullName: bestMatch.full_name,
        email:    bestMatch.email,
        role:     bestMatch.role,
      },
    });
  } catch (err) {
    console.error('face-login error:', err);
    res.status(500).json({ message: 'Server error during face login.' });
  }
};
