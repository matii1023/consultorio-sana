const pool = require('../config/db');
const { logAudit } = require('../services/audit.service');

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const {
      clinic_name,
      clinic_address,
      clinic_phone,
      clinic_email,
      clinic_website,
      clinic_tax_id,
      logo_url,
    } = req.body;

    const before = await pool.query('SELECT * FROM settings WHERE id = 1');

    const result = await pool.query(
      `UPDATE settings
       SET clinic_name = COALESCE($1, clinic_name),
           clinic_address = COALESCE($2, clinic_address),
           clinic_phone = COALESCE($3, clinic_phone),
           clinic_email = COALESCE($4, clinic_email),
           clinic_website = COALESCE($5, clinic_website),
           clinic_tax_id = COALESCE($6, clinic_tax_id),
           logo_url = COALESCE($7, logo_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [
        clinic_name,
        clinic_address,
        clinic_phone,
        clinic_email,
        clinic_website,
        clinic_tax_id,
        logo_url,
      ]
    );

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'settings',
      description: 'Actualizó la configuración del consultorio',
      oldData: before.rows[0],
      newData: result.rows[0],
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };