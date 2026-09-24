const pool = require('../config/db');
const { sendAppointmentConfirmation, sendAppointmentTicket } = require('../services/whatsapp.service');
const { logAudit } = require('../services/audit.service');

// GET /api/appointments
const getAllAppointments = async (req, res, next) => {
  try {
    const { date, doctor_id, patient_id, status } = req.query;

    let query = `
      SELECT
        a.id, a.date_time, a.duration, a.status, a.reason, a.notes,
        a.created_at,
        p.id AS patient_id, p.first_name AS patient_first_name,
        p.last_name AS patient_last_name, p.document_id AS patient_document,
        p.phone AS patient_phone,
        d.id AS doctor_id, d.consultation_fee,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        s.name AS specialty_name
      FROM appointments a
      INNER JOIN patients p ON p.id = a.patient_id
      INNER JOIN doctors d ON d.id = a.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN specialties s ON s.id = d.specialty_id
      WHERE 1 = 1
    `;
    const params = [];
    let i = 1;

    if (date)       { query += ` AND DATE(a.date_time) = $${i++}`; params.push(date); }
    if (doctor_id)  { query += ` AND a.doctor_id = $${i++}`;       params.push(doctor_id); }
    if (patient_id) { query += ` AND a.patient_id = $${i++}`;      params.push(patient_id); }
    if (status)     { query += ` AND a.status = $${i++}`;          params.push(status); }

    query += ' ORDER BY a.date_time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/week?date=YYYY-MM-DD
const getWeekAppointments = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Se requiere fecha' });

    const result = await pool.query(
      `SELECT
         a.id, a.date_time, a.duration, a.status, a.reason,
         p.id AS patient_id, p.first_name AS patient_first_name,
         p.last_name AS patient_last_name, p.phone AS patient_phone,
         d.id AS doctor_id,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE a.date_time >= DATE_TRUNC('week', $1::date)
         AND a.date_time < DATE_TRUNC('week', $1::date) + INTERVAL '7 days'
       ORDER BY a.date_time ASC`,
      [date]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
const getAppointmentStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dateTo = to || new Date().toISOString().slice(0, 10);

    const result = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM appointments
       WHERE DATE(date_time) BETWEEN $1 AND $2
       GROUP BY status`,
      [dateFrom, dateTo]
    );

    const stats = {
      total: 0, pending: 0, confirmed: 0, completed: 0,
      cancelled: 0, noShow: 0, inProgress: 0,
      attendanceRate: 0, confirmationRate: 0, noShowRate: 0,
    };

    result.rows.forEach((row) => {
      stats.total += row.count;
      if (row.status === 'PENDING') stats.pending = row.count;
      if (row.status === 'CONFIRMED') stats.confirmed = row.count;
      if (row.status === 'COMPLETED') stats.completed = row.count;
      if (row.status === 'CANCELLED') stats.cancelled = row.count;
      if (row.status === 'NO_SHOW') stats.noShow = row.count;
      if (row.status === 'IN_PROGRESS') stats.inProgress = row.count;
    });

    const finalized = stats.completed + stats.noShow;
    stats.attendanceRate = finalized > 0 ? Math.round((stats.completed / finalized) * 100) : 0;
    stats.noShowRate = finalized > 0 ? Math.round((stats.noShow / finalized) * 100) : 0;
    stats.confirmationRate = stats.total > 0 
      ? Math.round(((stats.confirmed + stats.completed + stats.inProgress) / stats.total) * 100) 
      : 0;

    res.json({ from: dateFrom, to: dateTo, ...stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/:id
const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
         a.*,
         p.first_name AS patient_first_name,
         p.last_name AS patient_last_name,
         p.phone AS patient_phone,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE a.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// POST /api/appointments
const createAppointment = async (req, res, next) => {
  try {
    const { patient_id, doctor_id, date_time, duration, reason, notes } = req.body;

    if (!patient_id || !doctor_id || !date_time) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const durationMin = duration || 30;

    const overlap = await pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1
         AND status NOT IN ('CANCELLED', 'NO_SHOW')
         AND (
           (date_time <= $2::timestamp AND date_time + (duration || ' minutes')::interval > $2::timestamp)
           OR
           (date_time < $2::timestamp + ($3 || ' minutes')::interval
             AND date_time >= $2::timestamp)
         )`,
      [doctor_id, date_time, durationMin]
    );

    if (overlap.rows.length > 0) {
      return res.status(409).json({
        message: 'El doctor ya tiene una cita en ese horario',
      });
    }

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, date_time, duration, reason, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING *`,
      [patient_id, doctor_id, date_time, durationMin, reason || null, notes || null]
    );

    const details = await pool.query(
      `SELECT
         p.first_name, p.last_name, p.phone,
         u.first_name AS doctor_first_name, u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM patients p
       INNER JOIN doctors d ON d.id = $1
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE p.id = $2`,
      [doctor_id, patient_id]
    );

    const info = details.rows[0];

    if (info && info.phone) {
      sendAppointmentConfirmation({
        patient: { first_name: info.first_name, phone: info.phone },
        doctor: { first_name: info.doctor_first_name, last_name: info.doctor_last_name },
        specialty: info.specialty_name,
        dateTime: date_time,
      }).catch((err) => console.error('Error WhatsApp:', err.message));
    }

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'appointment',
      entityId: result.rows[0].id,
      description: `Agendó cita para ${info?.first_name} ${info?.last_name} con Dr. ${info?.doctor_first_name} ${info?.doctor_last_name} el ${new Date(date_time).toLocaleString('es-AR')}`,
      newData: result.rows[0],
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PUT /api/appointments/:id
const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date_time, duration, reason, notes } = req.body;

    const before = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET date_time = COALESCE($1, date_time),
           duration = COALESCE($2, duration),
           reason = COALESCE($3, reason),
           notes = COALESCE($4, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [date_time, duration, reason, notes, id]
    );

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'appointment',
      entityId: id,
      description: `Actualizó la cita del ${new Date(before.rows[0].date_time).toLocaleString('es-AR')}`,
      oldData: before.rows[0],
      newData: result.rows[0],
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/appointments/:id/status
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const before = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    const statusLabels = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      IN_PROGRESS: 'En consulta',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No asistió',
    };

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'appointment',
      entityId: id,
      description: `Cambió el estado de la cita a "${statusLabels[status] || status}"`,
      oldData: { status: before.rows[0].status },
      newData: { status },
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/appointments/:id/reschedule
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date_time, duration, notify_patient } = req.body;

    if (!date_time) {
      return res.status(400).json({ message: 'La nueva fecha es obligatoria' });
    }

    const before = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const appt = before.rows[0];
    const durationMin = duration || appt.duration;

    const overlap = await pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1
         AND id != $2
         AND status NOT IN ('CANCELLED', 'NO_SHOW')
         AND (
           (date_time <= $3::timestamp AND date_time + (duration || ' minutes')::interval > $3::timestamp)
           OR
           (date_time < $3::timestamp + ($4 || ' minutes')::interval
             AND date_time >= $3::timestamp)
         )`,
      [appt.doctor_id, id, date_time, durationMin]
    );

    if (overlap.rows.length > 0) {
      return res.status(409).json({
        message: 'El doctor ya tiene una cita en ese horario',
      });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET date_time = $1, duration = $2, status = 'PENDING', updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [date_time, durationMin, id]
    );

    if (notify_patient) {
      const details = await pool.query(
        `SELECT
           p.first_name, p.last_name, p.phone,
           u.first_name AS doctor_first_name, u.last_name AS doctor_last_name,
           s.name AS specialty_name
         FROM appointments a
         INNER JOIN patients p ON p.id = a.patient_id
         INNER JOIN doctors d ON d.id = a.doctor_id
         INNER JOIN users u ON u.id = d.user_id
         INNER JOIN specialties s ON s.id = d.specialty_id
         WHERE a.id = $1`,
        [id]
      );

      const info = details.rows[0];
      if (info && info.phone) {
        sendAppointmentTicket({
          patient: {
            first_name: info.first_name,
            last_name: info.last_name,
            phone: info.phone,
          },
          doctor: {
            first_name: info.doctor_first_name,
            last_name: info.doctor_last_name,
          },
          specialty: info.specialty_name,
          dateTime: date_time,
          duration: durationMin,
          reason: appt.reason,
        }).catch((err) => console.error('Error WhatsApp:', err.message));
      }
    }

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'appointment',
      entityId: id,
      description: `Reprogramó la cita del ${new Date(appt.date_time).toLocaleString('es-AR')} al ${new Date(date_time).toLocaleString('es-AR')}`,
      oldData: appt,
      newData: result.rows[0],
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/appointments/:id
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const before = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING id`,
      [id]
    );

    await logAudit({
      req,
      action: 'DELETE',
      entity: 'appointment',
      entityId: id,
      description: `Canceló la cita del ${new Date(before.rows[0].date_time).toLocaleString('es-AR')}`,
      oldData: before.rows[0],
    });

    res.json({ message: 'Cita cancelada' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAppointments,
  getWeekAppointments,
  getAppointmentStats,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
};