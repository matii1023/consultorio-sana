const pool = require('../config/db');
const { logAudit } = require('../services/audit.service');

const getAllWaitlist = async (req, res, next) => {
  try {
    const { status = 'WAITING' } = req.query;

    const result = await pool.query(
      `SELECT
         w.id, w.priority, w.notes, w.status, w.created_at,
         w.preferred_date_from, w.preferred_date_to,
         p.id AS patient_id, p.first_name AS patient_first_name,
         p.last_name AS patient_last_name, p.phone AS patient_phone,
         d.id AS doctor_id, u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM waitlist w
       INNER JOIN patients p ON p.id = w.patient_id
       LEFT JOIN doctors d ON d.id = w.doctor_id
       LEFT JOIN users u ON u.id = d.user_id
       LEFT JOIN specialties s ON s.id = COALESCE(w.specialty_id, d.specialty_id)
       WHERE w.status = $1
       ORDER BY
         CASE w.priority WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 ELSE 3 END,
         w.created_at ASC`,
      [status]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const addToWaitlist = async (req, res, next) => {
  try {
    const {
      patient_id, doctor_id, specialty_id,
      preferred_date_from, preferred_date_to,
      priority, notes,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ message: 'El paciente es obligatorio' });
    }

    const result = await pool.query(
      `INSERT INTO waitlist
         (patient_id, doctor_id, specialty_id, preferred_date_from, preferred_date_to, priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        patient_id, doctor_id || null, specialty_id || null,
        preferred_date_from || null, preferred_date_to || null,
        priority || 'NORMAL', notes || null,
      ]
    );

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'waitlist',
      entityId: result.rows[0].id,
      description: `Agregó un paciente a la lista de espera`,
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateWaitlistStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['WAITING', 'SCHEDULED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const result = await pool.query(
      'UPDATE waitlist SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteWaitlistEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM waitlist WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }
    res.json({ message: 'Entrada eliminada' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllWaitlist,
  addToWaitlist,
  updateWaitlistStatus,
  deleteWaitlistEntry,
};