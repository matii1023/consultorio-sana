const pool = require('../config/db');
const { logAudit } = require('../services/audit.service');

// GET /api/specialties
const getAllSpecialties = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, is_active, created_at
       FROM specialties
       WHERE is_active = TRUE
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/specialties/:id
const getSpecialtyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, name, description, is_active, created_at
       FROM specialties WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// POST /api/specialties
const createSpecialty = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }

    const exists = await pool.query(
      'SELECT id FROM specialties WHERE name = $1',
      [name]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'Ya existe una especialidad con ese nombre' });
    }

    const result = await pool.query(
      `INSERT INTO specialties (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, is_active, created_at`,
      [name, description || null]
    );

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'specialty',
      entityId: result.rows[0].id,
      description: `Creó la especialidad "${name}"`,
      newData: result.rows[0],
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PUT /api/specialties/:id
const updateSpecialty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const before = await pool.query('SELECT * FROM specialties WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }

    const result = await pool.query(
      `UPDATE specialties
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           is_active = COALESCE($3, is_active)
       WHERE id = $4
       RETURNING id, name, description, is_active, created_at`,
      [name, description, is_active, id]
    );

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'specialty',
      entityId: id,
      description: `Actualizó la especialidad "${result.rows[0].name}"`,
      oldData: before.rows[0],
      newData: result.rows[0],
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/specialties/:id
const deleteSpecialty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const before = await pool.query('SELECT * FROM specialties WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }

    await pool.query(
      `UPDATE specialties SET is_active = FALSE WHERE id = $1`,
      [id]
    );

    await logAudit({
      req,
      action: 'DELETE',
      entity: 'specialty',
      entityId: id,
      description: `Desactivó la especialidad "${before.rows[0].name}"`,
      oldData: before.rows[0],
    });

    res.json({ message: 'Especialidad desactivada' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
};