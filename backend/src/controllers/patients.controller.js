const pool = require('../config/db');
const { logAudit } = require('../services/audit.service');

// GET /api/patients  -> Lista con búsqueda opcional
const getAllPatients = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT id, document_id, first_name, last_name, birth_date, gender,
             phone, email, address, emergency_contact, is_active, created_at
      FROM patients
      WHERE is_active = TRUE
    `;
    const params = [];

    if (search) {
      query += ` AND (
        LOWER(first_name) LIKE LOWER($1) OR
        LOWER(last_name) LIKE LOWER($1) OR
        document_id LIKE $1 OR
        phone LIKE $1
      )`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY last_name ASC, first_name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/patients/:id
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, document_id, first_name, last_name, birth_date, gender,
              phone, email, address, emergency_contact, is_active, created_at
       FROM patients WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// POST /api/patients
const createPatient = async (req, res, next) => {
  try {
    const {
      document_id, first_name, last_name, birth_date, gender,
      phone, email, address, emergency_contact,
    } = req.body;

    if (!document_id || !first_name || !last_name || !birth_date || !gender || !phone) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const exists = await pool.query(
      'SELECT id FROM patients WHERE document_id = $1',
      [document_id]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'Ya existe un paciente con ese documento' });
    }

    const result = await pool.query(
      `INSERT INTO patients
         (document_id, first_name, last_name, birth_date, gender, phone, email, address, emergency_contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [document_id, first_name, last_name, birth_date, gender, phone,
       email || null, address || null, emergency_contact || null]
    );

    // Auditoría
    await logAudit({
      req,
      action: 'CREATE',
      entity: 'patient',
      entityId: result.rows[0].id,
      description: `Creó al paciente ${first_name} ${last_name} (Doc: ${document_id})`,
      newData: result.rows[0],
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PUT /api/patients/:id
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      document_id, first_name, last_name, birth_date, gender,
      phone, email, address, emergency_contact, is_active,
    } = req.body;

    // Obtener datos previos para auditoría
    const before = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const result = await pool.query(
      `UPDATE patients
       SET document_id = COALESCE($1, document_id),
           first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           birth_date = COALESCE($4, birth_date),
           gender = COALESCE($5, gender),
           phone = COALESCE($6, phone),
           email = COALESCE($7, email),
           address = COALESCE($8, address),
           emergency_contact = COALESCE($9, emergency_contact),
           is_active = COALESCE($10, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [document_id, first_name, last_name, birth_date, gender, phone,
       email, address, emergency_contact, is_active, id]
    );

    // Auditoría
    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'patient',
      entityId: id,
      description: `Actualizó al paciente ${result.rows[0].first_name} ${result.rows[0].last_name}`,
      oldData: before.rows[0],
      newData: result.rows[0],
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/patients/:id (soft delete)
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener datos antes de desactivar
    const before = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const result = await pool.query(
      `UPDATE patients SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING id, first_name, last_name`,
      [id]
    );

    // Auditoría
    await logAudit({
      req,
      action: 'DELETE',
      entity: 'patient',
      entityId: id,
      description: `Desactivó al paciente ${before.rows[0].first_name} ${before.rows[0].last_name}`,
      oldData: before.rows[0],
    });

    res.json({ message: 'Paciente desactivado' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};