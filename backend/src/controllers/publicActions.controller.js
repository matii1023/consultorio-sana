const pool = require('../config/db');

const getAppointmentByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT
         a.id, a.date_time, a.duration, a.status, a.reason,
         a.confirm_token, a.cancel_token,
         p.first_name AS patient_first_name,
         p.last_name AS patient_last_name,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE a.confirm_token = $1 OR a.cancel_token = $1
       LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada o link inválido' });
    }

    const appt = result.rows[0];
    res.json({
      ...appt,
      is_confirm_token: appt.confirm_token === token,
      is_cancel_token: appt.cancel_token === token,
    });
  } catch (error) {
    next(error);
  }
};

const confirmAppointment = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      'SELECT id, status FROM appointments WHERE confirm_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Link inválido' });
    }

    const appt = result.rows[0];

    if (appt.status === 'CANCELLED') {
      return res.status(400).json({
        message: 'Esta cita ya fue cancelada. Contactate con el consultorio.',
      });
    }

    if (appt.status === 'CONFIRMED' || appt.status === 'COMPLETED') {
      return res.json({ message: 'La cita ya estaba confirmada', alreadyConfirmed: true });
    }

    await pool.query(
      `UPDATE appointments SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [appt.id]
    );

    console.log(`✅ Cita ${appt.id} confirmada vía link público`);
    res.json({ message: '¡Cita confirmada! Gracias por avisarnos.' });
  } catch (error) {
    next(error);
  }
};

const cancelAppointmentByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      'SELECT id, status FROM appointments WHERE cancel_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Link inválido' });
    }

    const appt = result.rows[0];

    if (appt.status === 'CANCELLED') {
      return res.json({ message: 'La cita ya estaba cancelada', alreadyCancelled: true });
    }

    if (appt.status === 'COMPLETED') {
      return res.status(400).json({
        message: 'No se puede cancelar una cita ya completada',
      });
    }

    await pool.query(
      `UPDATE appointments SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [appt.id]
    );

    console.log(`❌ Cita ${appt.id} cancelada vía link público`);
    res.json({ message: 'Cita cancelada. Contactate si necesitás reprogramar.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppointmentByToken,
  confirmAppointment,
  cancelAppointmentByToken,
};