const db = require('../config/db');

/**
 * GET /api/reports/owner
 * Full cross-module emission summary for all time or a date range.
 * Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD (optional)
 * Only accessible to: owner
 */
const getOwnerReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Build optional date filter clause for each module
    const dateClause = (col) =>
      from && to ? `AND ${col} BETWEEN ? AND ?` : '';
    const dateParams = from && to ? [from, to] : [];

    // ── Farming ───────────────────────────────────────────────
    const [farming] = await db.query(
      `SELECT
         COUNT(*)                      AS record_count,
         COALESCE(SUM(total_co2e_kg),0) AS total_co2e_kg,
         COALESCE(SUM(urea_kg),0)       AS total_urea_kg,
         COALESCE(SUM(irrigation_kwh),0) AS total_irrigation_kwh,
         COALESCE(SUM(area_treated_ha),0) AS total_area_ha
       FROM farming_activities
       WHERE 1=1 ${dateClause('activity_date')}`,
      dateParams
    );

    // ── Transport ─────────────────────────────────────────────
    const [transport] = await db.query(
      `SELECT
         COUNT(*)                      AS record_count,
         COALESCE(SUM(total_co2e_kg),0) AS total_co2e_kg,
         COALESCE(SUM(distance_km),0)   AS total_distance_km,
         COALESCE(SUM(load_weight_tonnes),0) AS total_load_tonnes
       FROM transportation
       WHERE 1=1 ${dateClause('trip_date')}`,
      dateParams
    );

    // ── Storage ───────────────────────────────────────────────
    const [storage] = await db.query(
      `SELECT
         COUNT(*)                      AS record_count,
         COALESCE(SUM(total_co2e_kg),0) AS total_co2e_kg,
         COALESCE(SUM(electricity_kwh),0) AS total_kwh,
         COALESCE(SUM(duration_days),0)   AS total_days
       FROM storage_usage
       WHERE 1=1 ${dateClause('start_date')}`,
      dateParams
    );

    // ── Packaging ─────────────────────────────────────────────
    const [packaging] = await db.query(
      `SELECT
         COUNT(*)                      AS record_count,
         COALESCE(SUM(total_co2e_kg),0) AS total_co2e_kg,
         COALESCE(SUM(material_weight_kg),0) AS total_material_kg,
         COALESCE(SUM(units_packaged),0)     AS total_units
       FROM packaging
       WHERE 1=1 ${dateClause('batch_date')}`,
      dateParams
    );

    const f = farming[0];
    const tr = transport[0];
    const st = storage[0];
    const pk = packaging[0];

    const farming_co2e   = parseFloat(f.total_co2e_kg);
    const transport_co2e = parseFloat(tr.total_co2e_kg);
    const storage_co2e   = parseFloat(st.total_co2e_kg);
    const packaging_co2e = parseFloat(pk.total_co2e_kg);
    const total_co2e     = farming_co2e + transport_co2e + storage_co2e + packaging_co2e;

    // ── Per-farm breakdown ────────────────────────────────────
    const [farmBreakdown] = await db.query(
      `SELECT
         f.farm_id, f.farm_name,
         COALESCE(SUM(fa.total_co2e_kg),0) AS farming_co2e_kg
       FROM farms f
       LEFT JOIN farming_activities fa ON fa.farm_id = f.farm_id
       GROUP BY f.farm_id, f.farm_name
       ORDER BY farming_co2e_kg DESC`
    );

    // ── Fuel type breakdown for transport ─────────────────────
    const [fuelBreakdown] = await db.query(
      `SELECT fuel_type,
              COALESCE(SUM(total_co2e_kg),0) AS co2e_kg,
              COUNT(*) AS trips
       FROM transportation
       WHERE 1=1 ${dateClause('trip_date')}
       GROUP BY fuel_type`,
      dateParams
    );

    return res.json({
      period: { from: from || 'all', to: to || 'all' },
      summary: {
        total_co2e_kg:    parseFloat(total_co2e.toFixed(4)),
        farming_co2e_kg:  parseFloat(farming_co2e.toFixed(4)),
        transport_co2e_kg: parseFloat(transport_co2e.toFixed(4)),
        storage_co2e_kg:  parseFloat(storage_co2e.toFixed(4)),
        packaging_co2e_kg: parseFloat(packaging_co2e.toFixed(4)),
      },
      modules: {
        farming: {
          record_count:        parseInt(f.record_count),
          total_co2e_kg:       parseFloat(farming_co2e.toFixed(4)),
          total_urea_kg:       parseFloat(f.total_urea_kg),
          total_irrigation_kwh: parseFloat(f.total_irrigation_kwh),
          total_area_ha:       parseFloat(f.total_area_ha),
        },
        transport: {
          record_count:       parseInt(tr.record_count),
          total_co2e_kg:      parseFloat(transport_co2e.toFixed(4)),
          total_distance_km:  parseFloat(tr.total_distance_km),
          total_load_tonnes:  parseFloat(tr.total_load_tonnes),
          fuel_breakdown:     fuelBreakdown,
        },
        storage: {
          record_count:  parseInt(st.record_count),
          total_co2e_kg: parseFloat(storage_co2e.toFixed(4)),
          total_kwh:     parseFloat(st.total_kwh),
          total_days:    parseInt(st.total_days),
        },
        packaging: {
          record_count:      parseInt(pk.record_count),
          total_co2e_kg:     parseFloat(packaging_co2e.toFixed(4)),
          total_material_kg: parseFloat(pk.total_material_kg),
          total_units:       parseInt(pk.total_units),
        },
      },
      farm_breakdown: farmBreakdown,
    });
  } catch (err) {
    console.error('getOwnerReport error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/reports/monthly
 * Month-by-month CO₂e totals per module for a given year.
 * Query params: ?year=2024  (defaults to current year)
 * Only accessible to: owner
 */
const getMonthlyReport = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const [farmMonthly] = await db.query(
      `SELECT MONTH(activity_date) AS month,
              COALESCE(SUM(total_co2e_kg),0) AS co2e_kg
       FROM   farming_activities
       WHERE  YEAR(activity_date) = ?
       GROUP BY MONTH(activity_date)
       ORDER BY month`,
      [year]
    );

    const [transportMonthly] = await db.query(
      `SELECT MONTH(trip_date) AS month,
              COALESCE(SUM(total_co2e_kg),0) AS co2e_kg
       FROM   transportation
       WHERE  YEAR(trip_date) = ?
       GROUP BY MONTH(trip_date)
       ORDER BY month`,
      [year]
    );

    const [storageMonthly] = await db.query(
      `SELECT MONTH(start_date) AS month,
              COALESCE(SUM(total_co2e_kg),0) AS co2e_kg
       FROM   storage_usage
       WHERE  YEAR(start_date) = ?
       GROUP BY MONTH(start_date)
       ORDER BY month`,
      [year]
    );

    const [packagingMonthly] = await db.query(
      `SELECT MONTH(batch_date) AS month,
              COALESCE(SUM(total_co2e_kg),0) AS co2e_kg
       FROM   packaging
       WHERE  YEAR(batch_date) = ?
       GROUP BY MONTH(batch_date)
       ORDER BY month`,
      [year]
    );

    // Build a unified 12-month array
    const MONTH_NAMES = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec',
    ];

    const toMap = (rows) => {
      const m = {};
      rows.forEach(r => { m[r.month] = parseFloat(r.co2e_kg); });
      return m;
    };

    const fMap  = toMap(farmMonthly);
    const trMap = toMap(transportMonthly);
    const stMap = toMap(storageMonthly);
    const pkMap = toMap(packagingMonthly);

    const monthly = MONTH_NAMES.map((name, i) => {
      const m = i + 1;
      const farming   = fMap[m]  || 0;
      const transport = trMap[m] || 0;
      const storage   = stMap[m] || 0;
      const packaging = pkMap[m] || 0;
      return {
        month:      m,
        month_name: name,
        farming_co2e_kg:   parseFloat(farming.toFixed(4)),
        transport_co2e_kg: parseFloat(transport.toFixed(4)),
        storage_co2e_kg:   parseFloat(storage.toFixed(4)),
        packaging_co2e_kg: parseFloat(packaging.toFixed(4)),
        total_co2e_kg:     parseFloat((farming + transport + storage + packaging).toFixed(4)),
      };
    });

    const annual_total = monthly.reduce((sum, m) => sum + m.total_co2e_kg, 0);

    return res.json({
      year,
      annual_total_co2e_kg: parseFloat(annual_total.toFixed(4)),
      monthly,
    });
  } catch (err) {
    console.error('getMonthlyReport error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getOwnerReport, getMonthlyReport };
