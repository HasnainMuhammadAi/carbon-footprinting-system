const db   = require('../config/db');
const { calcStorage } = require('../utils/carbonCalculator');

/**
 * GET /api/storage
 */
const getAllStorage = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query = `
      SELECT s.*, u.full_name AS recorded_by_name,
             f.farm_name
      FROM   storage_usage s
      JOIN   users u ON u.user_id = s.recorded_by
      LEFT JOIN farms f ON f.farm_id = s.farm_id
    `;
    const params = [];

    if (role !== 'owner') {
      query += ' WHERE s.recorded_by = ?';
      params.push(userId);
    }
    query += ' ORDER BY s.start_date DESC';

    const [rows] = await db.query(query, params);
    return res.json({ data: rows });
  } catch (err) {
    console.error('getAllStorage error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/storage
 * Body: { facility_name, farm_id, start_date, end_date,
 *         electricity_kwh, grid_region, refrigerant_type,
 *         refrigerant_leaked_kg, capacity_tonnes,
 *         product_stored_tonnes, notes }
 */
const createStorage = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      facility_name, farm_id = null,
      start_date, end_date,
      electricity_kwh, grid_region = 'pesco',
      refrigerant_type = 'none', refrigerant_leaked_kg = 0,
      capacity_tonnes, product_stored_tonnes,
      notes = null,
    } = req.body;

    if (!facility_name || !start_date || !end_date ||
        !electricity_kwh || !capacity_tonnes || !product_stored_tonnes) {
      return res.status(400).json({
        error: 'facility_name, start_date, end_date, electricity_kwh, capacity_tonnes and product_stored_tonnes are required',
      });
    }

    const start   = new Date(start_date);
    const end     = new Date(end_date);
    const duration_days = Math.max(1, Math.round((end - start) / 86400000));

    const total_co2e_kg = await calcStorage({
      electricity_kwh, refrigerant_type, refrigerant_leaked_kg,
    });

    const [result] = await db.query(
      `INSERT INTO storage_usage
         (recorded_by, facility_name, farm_id, start_date, end_date,
          duration_days, electricity_kwh, grid_region,
          refrigerant_type, refrigerant_leaked_kg,
          capacity_tonnes, product_stored_tonnes,
          total_co2e_kg, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId, facility_name, farm_id, start_date, end_date,
        duration_days, electricity_kwh, grid_region,
        refrigerant_type, refrigerant_leaked_kg,
        capacity_tonnes, product_stored_tonnes,
        total_co2e_kg, notes,
      ]
    );

    return res.status(201).json({
      message: 'Storage usage recorded',
      storageId: result.insertId,
      total_co2e_kg,
    });
  } catch (err) {
    console.error('createStorage error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

/**
 * DELETE /api/storage/:id
 */
const deleteStorage = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT storage_id, recorded_by FROM storage_usage WHERE storage_id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Record not found' });

    if (role !== 'owner' && rows[0].recorded_by !== userId) {
      return res.status(403).json({ error: 'You can only delete your own records' });
    }

    await db.query('DELETE FROM storage_usage WHERE storage_id = ?', [id]);
    return res.json({ message: 'Storage record deleted' });
  } catch (err) {
    console.error('deleteStorage error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllStorage, createStorage, deleteStorage };
