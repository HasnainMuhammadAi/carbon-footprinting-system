const db   = require('../config/db');
const { calcTransport } = require('../utils/carbonCalculator');

/**
 * GET /api/transport
 */
const getAllTransport = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query = `
      SELECT t.*, f.farm_name, u.full_name AS recorded_by_name
      FROM   transportation t
      JOIN   farms f ON f.farm_id = t.origin_farm_id
      JOIN   users u ON u.user_id = t.recorded_by
    `;
    const params = [];

    if (role !== 'owner') {
      query += ' WHERE t.recorded_by = ?';
      params.push(userId);
    }
    query += ' ORDER BY t.trip_date DESC';

    const [rows] = await db.query(query, params);
    return res.json({ data: rows });
  } catch (err) {
    console.error('getAllTransport error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/transport
 * Body: { origin_farm_id, trip_date, destination_city, distance_km,
 *         return_trip, vehicle_type, fuel_type, fuel_consumed_litres,
 *         load_weight_tonnes, peach_crates_count, notes }
 */
const createTransport = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      origin_farm_id, trip_date, destination_city,
      distance_km, return_trip = 0,
      vehicle_type, fuel_type,
      fuel_consumed_litres = 0,
      load_weight_tonnes, peach_crates_count = null,
      notes = null,
    } = req.body;

    if (!origin_farm_id || !trip_date || !destination_city ||
        !distance_km || !vehicle_type || !fuel_type || !load_weight_tonnes) {
      return res.status(400).json({
        error: 'origin_farm_id, trip_date, destination_city, distance_km, vehicle_type, fuel_type and load_weight_tonnes are required',
      });
    }

    const [farms] = await db.query('SELECT farm_id FROM farms WHERE farm_id = ?', [origin_farm_id]);
    if (!farms.length) return res.status(404).json({ error: 'Farm not found' });

    const total_co2e_kg = await calcTransport({
      vehicle_type, fuel_type, distance_km,
      load_weight_tonnes, fuel_consumed_litres, return_trip,
    });

    const [result] = await db.query(
      `INSERT INTO transportation
         (recorded_by, origin_farm_id, trip_date, destination_city,
          distance_km, return_trip, vehicle_type, fuel_type,
          fuel_consumed_litres, load_weight_tonnes,
          peach_crates_count, total_co2e_kg, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId, origin_farm_id, trip_date, destination_city,
        distance_km, return_trip ? 1 : 0, vehicle_type, fuel_type,
        fuel_consumed_litres, load_weight_tonnes,
        peach_crates_count, total_co2e_kg, notes,
      ]
    );

    return res.status(201).json({
      message: 'Transport trip recorded',
      tripId: result.insertId,
      total_co2e_kg,
    });
  } catch (err) {
    console.error('createTransport error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

/**
 * DELETE /api/transport/:id
 */
const deleteTransport = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT trip_id, recorded_by FROM transportation WHERE trip_id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Record not found' });

    if (role !== 'owner' && rows[0].recorded_by !== userId) {
      return res.status(403).json({ error: 'You can only delete your own records' });
    }

    await db.query('DELETE FROM transportation WHERE trip_id = ?', [id]);
    return res.json({ message: 'Transport trip deleted' });
  } catch (err) {
    console.error('deleteTransport error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllTransport, createTransport, deleteTransport };
