const pool = require('../config/db');
const { logAudit } = require('../services/audit.service');

// GET /api/prescriptions?patient_id=...&doctor_id=...
const getAllPrescriptions = async (req, res, next) => {
  try {
    const { patient_id, doctor_id, medical_record_id } = req.query;

    let query = `
      SELECT
        p.id, p.patient_id, p.doctor_id, p.medical_record_id,
        p.diagnosis, p.medications, p.instructions, p.created_at,
        pat.first_name AS patient_first_name,
        pat.last_name AS patient_last_name,
        pat.document_id AS patient_document,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        s.name AS specialty_name
      FROM prescriptions p
      INNER JOIN patients pat ON pat.id = p.patient_id
      INNER JOIN doctors d ON d.id = p.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN specialties s ON s.id = d.specialty_id
      WHERE 1 = 1
    `;
    const params = [];
    let i = 1;

    if (patient_id)        { query += ` AND p.patient_id = $${i++}`;        params.push(patient_id); }
    if (doctor_id)         { query += ` AND p.doctor_id = $${i++}`;         params.push(doctor_id); }
    if (medical_record_id) { query += ` AND p.medical_record_id = $${i++}`; params.push(medical_record_id); }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/prescriptions/patient/:patientId
const getPatientPrescriptions = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `SELECT
         p.id, p.diagnosis, p.medications, p.instructions, p.created_at,
         p.medical_record_id,
         u.first_name AS doctor_first_name,
         u.last_name AS doctor_last_name,
         s.name AS specialty_name
       FROM prescriptions p
       INNER JOIN doctors d ON d.id = p.doctor_id
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE p.patient_id = $1
       ORDER BY p.created_at DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// POST /api/prescriptions
const createPrescription = async (req, res, next) => {
  try {
    const {
      patient_id,
      medical_record_id,
      diagnosis,
      medications,
      instructions,
    } = req.body;

    if (!patient_id || !medications || medications.length === 0) {
      return res.status(400).json({
        message: 'Paciente y al menos un medicamento son obligatorios',
      });
    }

    // Obtener doctor del usuario logueado
    const doctorQuery = await pool.query(
      'SELECT id FROM doctors WHERE user_id = $1',
      [req.user.id]
    );

    if (doctorQuery.rows.length === 0) {
      return res.status(403).json({
        message: 'Solo un médico registrado puede crear recetas',
      });
    }

    const doctorId = doctorQuery.rows[0].id;

    const result = await pool.query(
      `INSERT INTO prescriptions
         (patient_id, doctor_id, medical_record_id, diagnosis, medications, instructions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        patient_id,
        doctorId,
        medical_record_id || null,
        diagnosis || null,
        JSON.stringify(medications),
        instructions || null,
      ]
    );

    // Auditoría
    const patientInfo = await pool.query(
      'SELECT first_name, last_name FROM patients WHERE id = $1',
      [patient_id]
    );

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'prescription',
      entityId: result.rows[0].id,
      description: `Emitió receta para ${patientInfo.rows[0]?.first_name} ${patientInfo.rows[0]?.last_name} (${medications.length} medicamento${medications.length !== 1 ? 's' : ''})`,
      newData: result.rows[0],
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPrescriptions,
  getPatientPrescriptions,
  createPrescription,
};