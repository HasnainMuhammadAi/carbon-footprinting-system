const db = require('../config/db');

/**
 * Fetch a single emission factor from the emission_factors table.
 * Always uses the most recent valid_from_year where valid_to_year IS NULL.
 */
async function getFactor(category, activityType) {
  const [rows] = await db.query(
    `SELECT factor_value
     FROM   emission_factors
     WHERE  category      = ?
       AND  activity_type = ?
       AND  valid_to_year IS NULL
     ORDER BY valid_from_year DESC
     LIMIT 1`,
    [category, activityType]
  );
  if (!rows.length) {
    throw new Error(`Emission factor not found: ${category} / ${activityType}`);
  }
  return parseFloat(rows[0].factor_value);
}

/**
 * FARMING
 * Computes total kg CO₂e for one farming_activities row.
 *
 * Formulae:
 *   urea          = urea_kg              × factor(farming, urea)
 *   dap           = dap_kg               × factor(farming, dap)
 *   compost       = organic_compost_kg   × factor(farming, organic_compost)
 *   pesticide     = pesticide_litres     × factor(farming, pesticide_organophosphate)
 *   irrigation    = irrigation_kwh       × factor(farming, irrigation_electricity_pesco)
 *   machinery     = machinery_diesel_L   × factor(farming, diesel_machinery)
 */
async function calcFarming(data) {
  const {
    urea_kg = 0,
    dap_kg = 0,
    organic_compost_kg = 0,
    pesticide_litres = 0,
    irrigation_kwh = 0,
    machinery_diesel_litres = 0,
  } = data;

  const [fUrea, fDap, fCompost, fPest, fIrrig, fDiesel] = await Promise.all([
    getFactor('farming', 'urea'),
    getFactor('farming', 'dap'),
    getFactor('farming', 'organic_compost'),
    getFactor('farming', 'pesticide_organophosphate'),
    getFactor('farming', 'irrigation_electricity_pesco'),
    getFactor('farming', 'diesel_machinery'),
  ]);

  const total =
    urea_kg              * fUrea   +
    dap_kg               * fDap    +
    organic_compost_kg   * fCompost +
    pesticide_litres     * fPest   +
    irrigation_kwh       * fIrrig  +
    machinery_diesel_litres * fDiesel;

  return parseFloat(total.toFixed(4));
}

/**
 * TRANSPORT
 * emission = distance_km × load_weight_tonnes × factor(transport, vehicle_fuel_key)
 * Return-trip doubles the distance.
 */
async function calcTransport(data) {
  const {
    vehicle_type,
    fuel_type,
    distance_km,
    load_weight_tonnes,
    fuel_consumed_litres = 0,
    return_trip = 0,
  } = data;

  // Build the activity_type key used in emission_factors
  const activityType = `${fuel_type}_${vehicle_type}`;
  const factor = await getFactor('transport', activityType);

  const effectiveDistance = distance_km * (return_trip ? 2 : 1);
  const total = effectiveDistance * parseFloat(load_weight_tonnes) * factor;

  return parseFloat(total.toFixed(4));
}

/**
 * STORAGE
 * electricity emission = electricity_kwh × grid factor
 * refrigerant emission = refrigerant_leaked_kg × GWP factor
 */
async function calcStorage(data) {
  const {
    electricity_kwh,
    refrigerant_type = 'none',
    refrigerant_leaked_kg = 0,
  } = data;

  const fGrid = await getFactor('storage', 'grid_electricity_pakistan');
  let total = parseFloat(electricity_kwh) * fGrid;

  if (refrigerant_type !== 'none' && parseFloat(refrigerant_leaked_kg) > 0) {
    const fRef = await getFactor('storage', `refrigerant_${refrigerant_type}_leakage`);
    total += parseFloat(refrigerant_leaked_kg) * fRef;
  }

  return parseFloat(total.toFixed(4));
}

/**
 * PACKAGING
 * material emission = material_weight_kg × factor × recycled_discount
 * waste emission    = packaging_waste_kg × factor(packaging, waste_<disposal>)
 *
 * Recycled discount: each 1% recycled content reduces embodied factor by 0.4%.
 */
async function calcPackaging(data) {
  const {
    material_type,
    material_weight_kg,
    recycled_content_pct = 0,
    packaging_waste_kg = 0,
    waste_disposal = 'landfill',
  } = data;

  const fMaterial = await getFactor('packaging', material_type);
  const discount   = 1 - (parseFloat(recycled_content_pct) / 100) * 0.4;
  let total = parseFloat(material_weight_kg) * fMaterial * discount;

  if (parseFloat(packaging_waste_kg) > 0) {
    const fWaste = await getFactor('packaging', `waste_${waste_disposal}`);
    total += parseFloat(packaging_waste_kg) * fWaste;
  }

  return parseFloat(total.toFixed(4));
}

module.exports = { calcFarming, calcTransport, calcStorage, calcPackaging };
