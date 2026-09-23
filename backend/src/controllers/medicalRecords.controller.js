const pool = require('../config/db');
const { logAudit } = require('../services/audit.service');

// GET /api/medical-records
const getAllMedicalRecords = async (req, res, next) => {
  try {
    const { patient_id, doctor_id, appointment_id } = req.query;

    let query = `
      SELECT
        mr.id, mr.patient_id, mr.doctor_id, mr.appointment_id,
        mr.vitals, mr.symptoms, mr.diagnosis, mr.treatment,
        mr.notes, mr.attachments, mr.created_at, mr.updated_at,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.document_id AS patient_document,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        s.name AS specialty_name
      FROM medical_records mr
      INNER JOIN patients p ON p.id = mr.patient_id
      INNER JOIN doctors d ON d.id = mr.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN specialties s ON s.id = d.specialty_id
      WHERE 1 = 1
    `;
    const params = [];
    let i = 1;

    if (patient_id)     { query += ` AND mr.patient_id = $${i++}`;     params.push(patient_id); }
    if (doctor_id)      { query += ` AND mr.doctor_id = $${i++}`;      params.push(doctor_id); }
    if (appointment_id) { query += ` AND mr.appointment_id = $${i++}`; params.push(appointment_id); }

    query += ' ORDER BY mr.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/medical-records/:id
const getMedicalRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
         mr.*,
         p.first_name AS patient_first_name,
         p.last_name AS patient_last_name,
         p.document_id AS patient_document,
         p.birth_date AS patient_birth_date,
         p.phone AS patient_phone,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM medical_records mr
       INNER JOIN patients p ON p.id = mr.patient_id
       INNER JOIN doctors d ON d.id = mr.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE mr.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// GET /api/medical-records/patient/:patientId/history
const getPatientHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `SELECT
         mr.id, mr.date_time_consult, mr.vitals, mr.symptoms,
         mr.diagnosis, mr.treatment, mr.notes, mr.attachments,
         mr.created_at,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name,
         a.date_time AS appointment_date
       FROM medical_records mr
       INNER JOIN doctors d ON d.id = mr.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       LEFT JOIN appointments a ON a.id = mr.appointment_id
       WHERE mr.patient_id = $1
       ORDER BY mr.created_at DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// POST /api/medical-records
const createMedicalRecord = async (req, res, next) => {
  try {
    const {
      patient_id, appointment_id, vitals,
      symptoms, diagnosis, treatment, notes, attachments,
    } = req.body;

    if (!patient_id || !symptoms || !diagnosis || !treatment) {
      return res.status(400).json({
        message: 'Paciente, síntomas, diagnóstico y tratamiento son obligatorios',
      });
    }

    const doctorQuery = await pool.query(
      'SELECT id FROM doctors WHERE user_id = $1',
      [req.user.id]
    );

    if (doctorQuery.rows.length === 0) {
      return res.status(403).json({
        message: 'Solo un médico registrado puede crear historia clínica',
      });
    }
    const doctorId = doctorQuery.rows[0].id;

    const result = await pool.query(
      `INSERT INTO medical_records
         (patient_id, doctor_id, appointment_id, vitals,
          symptoms, diagnosis, treatment, notes, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        patient_id, doctorId, appointment_id || null,
        vitals ? JSON.stringify(vitals) : null,
        symptoms, diagnosis, treatment,
        notes || null, attachments || null,
      ]
    );

    if (appointment_id) {
      await pool.query(
        `UPDATE appointments
         SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [appointment_id]
      );
    }

    // Obtener nombre del paciente para la descripción
    const patientInfo = await pool.query(
      'SELECT first_name, last_name FROM patients WHERE id = $1',
      [patient_id]
    );

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'medical_record',
      entityId: result.rows[0].id,
      description: `Registró consulta para ${patientInfo.rows[0]?.first_name} ${patientInfo.rows[0]?.last_name} - Diagnóstico: ${diagnosis.substring(0, 100)}`,
      newData: result.rows[0],
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PUT /api/medical-records/:id
const updateMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      vitals, symptoms, diagnosis, treatment, notes, attachments,
    } = req.body;

    const ownerQuery = await pool.query(
      `SELECT d.user_id, mr.*
       FROM medical_records mr
       INNER JOIN doctors d ON d.id = mr.doctor_id
       WHERE mr.id = $1`,
      [id]
    );

    if (ownerQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    if (ownerQuery.rows[0].user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'No puedes editar un registro que no es tuyo',
      });
    }

    const result = await pool.query(
      `UPDATE medical_records
       SET vitals = COALESCE($1, vitals),
           symptoms = COALESCE($2, symptoms),
           diagnosis = COALESCE($3, diagnosis),
           treatment = COALESCE($4, treatment),
           notes = COALESCE($5, notes),
           attachments = COALESCE($6, attachments),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        vitals ? JSON.stringify(vitals) : null,
        symptoms, diagnosis, treatment, notes, attachments, id,
      ]
    );

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'medical_record',
      entityId: id,
      description: `Actualizó el registro clínico. Nuevo diagnóstico: ${result.rows[0].diagnosis.substring(0, 100)}`,
      oldData: ownerQuery.rows[0],
      newData: result.rows[0],
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/medical-records/:id
const deleteMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const before = await pool.query(
      'SELECT * FROM medical_records WHERE id = $1',
      [id]
    );
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    await pool.query('DELETE FROM medical_records WHERE id = $1', [id]);

    await logAudit({
      req,
      action: 'DELETE',
      entity: 'medical_record',
      entityId: id,
      description: `Eliminó un registro clínico. Diagnóstico: ${before.rows[0].diagnosis.substring(0, 100)}`,
      oldData: before.rows[0],
    });

    res.json({ message: 'Registro eliminado' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMedicalRecords,
  getMedicalRecordById,
  getPatientHistory,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
};