const db   = require('../config/db');
const { calcPackaging } = require('../utils/carbonCalculator');

/**
 * GET /api/packaging
 */
const getAllPackaging = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query = `
      SELECT p.*, u.full_name AS recorded_by_name,
             f.farm_name
      FROM   packaging p
      JOIN   users u ON u.user_id = p.recorded_by
      LEFT JOIN farms f ON f.farm_id = p.farm_id
    `;
    const params = [];

    if (role !== 'owner') {
      query += ' WHERE p.recorded_by = ?';
      params.push(userId);
    }
    query += ' ORDER BY p.batch_date DESC';

    const [rows] = await db.query(query, params);
    return res.json({ data: rows });
  } catch (err) {
    console.error('getAllPackaging error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/packaging
 * Body: { farm_id, batch_date, material_type, material_weight_kg,
 *         recycled_content_pct, units_packaged, avg_unit_weight_kg,
 *         packaging_waste_kg, waste_disposal, notes }
 */
const createPackaging = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      farm_id = null, batch_date, material_type,
      material_weight_kg, recycled_content_pct = 0,
      units_packaged, avg_unit_weight_kg,
      packaging_waste_kg = 0,
      waste_disposal = 'landfill',
      notes = null,
    } = req.body;

    if (!batch_date || !material_type || !material_weight_kg ||
        !units_packaged || !avg_unit_weight_kg) {
      return res.status(400).json({
        error: 'batch_date, material_type, material_weight_kg, units_packaged and avg_unit_weight_kg are required',
      });
    }

    const total_co2e_kg = await calcPackaging({
      material_type, material_weight_kg,
      recycled_content_pct, packaging_waste_kg, waste_disposal,
    });

    const [result] = await db.query(
      `INSERT INTO packaging
         (recorded_by, farm_id, batch_date, material_type,
          material_weight_kg, recycled_content_pct,
          units_packaged, avg_unit_weight_kg,
          packaging_waste_kg, waste_disposal,
          total_co2e_kg, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId, farm_id, batch_date, material_type,
        material_weight_kg, recycled_content_pct,
        units_packaged, avg_unit_weight_kg,
        packaging_waste_kg, waste_disposal,
        total_co2e_kg, notes,
      ]
    );

    return res.status(201).json({
      message: 'Packaging batch recorded',
      batchId: result.insertId,
      total_co2e_kg,
    });
  } catch (err) {
    console.error('createPackaging error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

/**
 * DELETE /api/packaging/:id
 */
const deletePackaging = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT batch_id, recorded_by FROM packaging WHERE batch_id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Record not found' });

    if (role !== 'owner' && rows[0].recorded_by !== userId) {
      return res.status(403).json({ error: 'You can only delete your own records' });
    }

    await db.query('DELETE FROM packaging WHERE batch_id = ?', [id]);
    return res.json({ message: 'Packaging batch deleted' });
  } catch (err) {
    console.error('deletePackaging error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllPackaging, createPackaging, deletePackaging };
