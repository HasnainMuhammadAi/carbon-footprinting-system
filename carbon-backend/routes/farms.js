const express = require('express');
const router  = express.Router();
const { verifyJWT } = require('../middleware/authMiddleware');
const db = require('../config/db');

/**
 * GET /api/farms
 * Returns all farms. Any authenticated user can read farms
 * (they need the list to fill dropdowns in their panel).
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT farm_id, farm_name, village, district, area_hectares
       FROM   farms
       ORDER  BY farm_name ASC`
    );
    return res.json({ data: rows });
  } catch (err) {
    console.error('GET /farms error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/farms
 * Create a new farm. Owner only.
 */
router.post('/', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can create farms' });
    }

    const {
      farm_name, village, district = 'Swat',
      province = 'Khyber Pakhtunkhwa',
      area_hectares, latitude = null, longitude = null,
      soil_type = null, irrigation_src = null,
    } = req.body;

    if (!farm_name || !village || !area_hectares) {
      return res.status(400).json({ error: 'farm_name, village and area_hectares are required' });
    }

    const [result] = await db.query(
      `INSERT INTO farms
         (created_by, farm_name, village, district, province,
          area_hectares, latitude, longitude, soil_type, irrigation_src)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [req.user.userId, farm_name, village, district, province,
       area_hectares, latitude, longitude, soil_type, irrigation_src]
    );

    return res.status(201).json({ message: 'Farm created', farmId: result.insertId });
  } catch (err) {
    console.error('POST /farms error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
