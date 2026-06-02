const db   = require('../config/db');
const { calcFarming } = require('../utils/carbonCalculator');

/**
 * GET /api/farming
 * Returns all farming activities accessible to the requester.
 * Owner sees all; farming_admin sees only their own records.
 */
const getAllFarming = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query  = `
      SELECT fa.*, f.farm_name, u.full_name AS recorded_by_name
      FROM   farming_activities fa
      JOIN   farms f ON f.farm_id = fa.farm_id
      JOIN   users u ON u.user_id = fa.recorded_by
    `;
    const params = [];

    if (role !== 'owner') {
      query += ' WHERE fa.recorded_by = ?';
      params.push(userId);
    }
    query += ' ORDER BY fa.activity_date DESC';

    const [rows] = await db.query(query, params);
    return res.json({ data: rows });
  } catch (err) {
    console.error('getAllFarming error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/farming
 * Body: { farm_id, activity_date, crop_cycle, urea_kg, dap_kg,
 *         organic_compost_kg, pesticide_type, pesticide_litres,
 *         irrigation_kwh, machinery_diesel_litres, area_treated_ha, notes }
 */
const createFarming = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      farm_id, activity_date, crop_cycle,
      urea_kg = 0, dap_kg = 0, organic_compost_kg = 0,
      pesticide_type = null, pesticide_litres = 0,
      irrigation_kwh = 0, machinery_diesel_litres = 0,
      area_treated_ha, notes = null,
    } = req.body;

    if (!farm_id || !activity_date || !crop_cycle || !area_treated_ha) {
      return res.status(400).json({
        error: 'farm_id, activity_date, crop_cycle and area_treated_ha are required',
      });
    }

    // Verify farm exists
    const [farms] = await db.query('SELECT farm_id FROM farms WHERE farm_id = ?', [farm_id]);
    if (!farms.length) return res.status(404).json({ error: 'Farm not found' });

    // Calculate emissions before insert
    const total_co2e_kg = await calcFarming({
      urea_kg, dap_kg, organic_compost_kg,
      pesticide_litres, irrigation_kwh, machinery_diesel_litres,
    });

    const [result] = await db.query(
      `INSERT INTO farming_activities
         (farm_id, recorded_by, activity_date, crop_cycle,
          urea_kg, dap_kg, organic_compost_kg,
          pesticide_type, pesticide_litres,
          irrigation_kwh, machinery_diesel_litres,
          area_treated_ha, total_co2e_kg, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        farm_id, userId, activity_date, crop_cycle,
        urea_kg, dap_kg, organic_compost_kg,
        pesticide_type, pesticide_litres,
        irrigation_kwh, machinery_diesel_litres,
        area_treated_ha, total_co2e_kg, notes,
      ]
    );

    return res.status(201).json({
      message: 'Farming activity recorded',
      activityId:   result.insertId,
      total_co2e_kg,
    });
  } catch (err) {
    console.error('createFarming error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

/**
 * DELETE /api/farming/:id
 * Owner can delete any; farming_admin can only delete their own.
 */
const deleteFarming = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT activity_id, recorded_by FROM farming_activities WHERE activity_id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Record not found' });

    if (role !== 'owner' && rows[0].recorded_by !== userId) {
      return res.status(403).json({ error: 'You can only delete your own records' });
    }

    await db.query('DELETE FROM farming_activities WHERE activity_id = ?', [id]);
    return res.json({ message: 'Farming activity deleted' });
  } catch (err) {
    console.error('deleteFarming error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllFarming, createFarming, deleteFarming };
