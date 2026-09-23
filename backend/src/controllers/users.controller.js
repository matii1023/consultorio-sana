const pool = require('../config/db');
const { hashPassword } = require('../utils/bcrypt');
const { logAudit } = require('../services/audit.service');

// GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;

    let query = `
      SELECT id, email, role, first_name, last_name, phone, is_active, created_at
      FROM users
      WHERE 1 = 1
    `;
    const params = [];
    let i = 1;

    if (role) {
      query += ` AND role = $${i++}`;
      params.push(role);
    }

    if (search) {
      query += ` AND (
        LOWER(first_name) LIKE LOWER($${i}) OR
        LOWER(last_name) LIKE LOWER($${i}) OR
        LOWER(email) LIKE LOWER($${i})
      )`;
      params.push(`%${search}%`);
      i++;
    }

    query += ' ORDER BY role ASC, last_name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, email, role, first_name, last_name, phone, is_active, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { email, password, role, first_name, last_name, phone } = req.body;

    if (!email || !password || !role || !first_name || !last_name) {
      return res.status(400).json({
        message: 'Email, contraseña, rol, nombre y apellido son obligatorios',
      });
    }

    const validRoles = ['ADMIN', 'SECRETARY', 'DOCTOR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    let normalizedEmail = email;
    if (!email.includes('@')) {
      normalizedEmail = `${email}@sana.local`;
    }

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [
      normalizedEmail,
    ]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, first_name, last_name, phone, is_active, created_at`,
      [normalizedEmail, passwordHash, role, first_name, last_name, phone || null]
    );

    const roleLabels = { ADMIN: 'Administrador', SECRETARY: 'Secretaria', DOCTOR: 'Médico' };

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'user',
      entityId: result.rows[0].id,
      description: `Creó al usuario ${first_name} ${last_name} (${roleLabels[role]}) con email ${normalizedEmail}`,
      newData: { ...result.rows[0], password: undefined },
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, role, is_active } = req.body;

    const before = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           role = COALESCE($4, role),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, role, first_name, last_name, phone, is_active`,
      [first_name, last_name, phone, role, is_active, id]
    );

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'user',
      entityId: id,
      description: `Actualizó al usuario ${result.rows[0].first_name} ${result.rows[0].last_name}`,
      oldData: { ...before.rows[0], password_hash: undefined },
      newData: result.rows[0],
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/password
const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 4) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 4 caracteres',
      });
    }

    const target = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [id]
    );
    if (target.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const passwordHash = await hashPassword(new_password);

    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, id]
    );

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'user',
      entityId: id,
      description: `Cambió la contraseña de ${target.rows[0].first_name} ${target.rows[0].last_name} (${target.rows[0].email})`,
    });

    res.json({ message: 'Contraseña actualizada', user: target.rows[0] });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id (soft delete)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: 'No puedes desactivar tu propio usuario' });
    }

    const before = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [id]
    );
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await pool.query(
      `UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    await logAudit({
      req,
      action: 'DELETE',
      entity: 'user',
      entityId: id,
      description: `Desactivó al usuario ${before.rows[0].first_name} ${before.rows[0].last_name} (${before.rows[0].email})`,
      oldData: before.rows[0],
    });

    res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
};