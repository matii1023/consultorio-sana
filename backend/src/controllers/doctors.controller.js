const pool = require('../config/db');
const { hashPassword } = require('../utils/bcrypt');
const { logAudit } = require('../services/audit.service');

// GET /api/doctors
const getAllDoctors = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         d.id,
         d.license_number,
         d.bio,
         d.consultation_fee,
         d.created_at,
         u.id AS user_id,
         u.email,
         u.first_name,
         u.last_name,
         u.phone,
         u.is_active,
         s.id AS specialty_id,
         s.name AS specialty_name
       FROM doctors d
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE u.is_active = TRUE
       ORDER BY u.first_name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/doctors/:id
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
         d.id, d.license_number, d.bio, d.consultation_fee,
         u.id AS user_id, u.email, u.first_name, u.last_name, u.phone,
         s.id AS specialty_id, s.name AS specialty_name
       FROM doctors d
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN specialties s ON s.id = d.specialty_id
       WHERE d.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// POST /api/doctors
const createDoctor = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      email, password, first_name, last_name, phone,
      specialty_id, license_number, bio, consultation_fee,
    } = req.body;

    if (!email || !password || !first_name || !last_name || !specialty_id || !license_number) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    await client.query('BEGIN');

    const emailExists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const licenseExists = await client.query(
      'SELECT id FROM doctors WHERE license_number = $1',
      [license_number]
    );
    if (licenseExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'La matrícula ya está registrada' });
    }

    const passwordHash = await hashPassword(password);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, 'DOCTOR', $3, $4, $5)
       RETURNING id, email, first_name, last_name`,
      [email, passwordHash, first_name, last_name, phone || null]
    );
    const userId = userResult.rows[0].id;

    const doctorResult = await client.query(
      `INSERT INTO doctors (user_id, specialty_id, license_number, bio, consultation_fee)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, license_number, bio, consultation_fee`,
      [userId, specialty_id, license_number, bio || null, consultation_fee || null]
    );

    await client.query('COMMIT');

    // Auditoría (después del commit)
    await logAudit({
      req,
      action: 'CREATE',
      entity: 'doctor',
      entityId: doctorResult.rows[0].id,
      description: `Creó al Dr. ${first_name} ${last_name} (Mat: ${license_number})`,
      newData: {
        ...doctorResult.rows[0],
        user_id: userId,
        email: userResult.rows[0].email,
        first_name: userResult.rows[0].first_name,
        last_name: userResult.rows[0].last_name,
      },
    });

    res.status(201).json({
      ...doctorResult.rows[0],
      user_id: userId,
      email: userResult.rows[0].email,
      first_name: userResult.rows[0].first_name,
      last_name: userResult.rows[0].last_name,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// PUT /api/doctors/:id
const updateDoctor = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      first_name, last_name, phone,
      specialty_id, license_number, bio, consultation_fee,
    } = req.body;

    await client.query('BEGIN');

    const doctorQuery = await client.query(
      'SELECT user_id FROM doctors WHERE id = $1',
      [id]
    );
    if (doctorQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }
    const userId = doctorQuery.rows[0].user_id;

    const beforeData = await client.query(
      `SELECT d.*, u.first_name, u.last_name, u.phone
       FROM doctors d INNER JOIN users u ON u.id = d.user_id
       WHERE d.id = $1`,
      [id]
    );

    await client.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone)
       WHERE id = $4`,
      [first_name, last_name, phone, userId]
    );

    const result = await client.query(
      `UPDATE doctors
       SET specialty_id = COALESCE($1, specialty_id),
           license_number = COALESCE($2, license_number),
           bio = COALESCE($3, bio),
           consultation_fee = COALESCE($4, consultation_fee)
       WHERE id = $5
       RETURNING id, license_number, bio, consultation_fee`,
      [specialty_id, license_number, bio, consultation_fee, id]
    );

    await client.query('COMMIT');

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'doctor',
      entityId: id,
      description: `Actualizó al Dr. ${first_name || beforeData.rows[0].first_name} ${last_name || beforeData.rows[0].last_name}`,
      oldData: beforeData.rows[0],
      newData: result.rows[0],
    });

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// DELETE /api/doctors/:id
const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const before = await pool.query(
      `SELECT d.*, u.first_name, u.last_name
       FROM doctors d INNER JOIN users u ON u.id = d.user_id
       WHERE d.id = $1`,
      [id]
    );
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    await pool.query(
      `UPDATE users SET is_active = FALSE
       WHERE id = (SELECT user_id FROM doctors WHERE id = $1)`,
      [id]
    );

    await logAudit({
      req,
      action: 'DELETE',
      entity: 'doctor',
      entityId: id,
      description: `Desactivó al Dr. ${before.rows[0].first_name} ${before.rows[0].last_name}`,
      oldData: before.rows[0],
    });

    res.json({ message: 'Doctor desactivado' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};