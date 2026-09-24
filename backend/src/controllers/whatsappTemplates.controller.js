const pool = require('../config/db');
const { logAudit } = require('../services/audit.service');

// GET /api/whatsapp-templates
const getAllTemplates = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, key, name, description, body, variables, is_active, updated_at
       FROM whatsapp_templates
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/whatsapp-templates/:key
const getTemplateByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const result = await pool.query(
      `SELECT * FROM whatsapp_templates WHERE key = $1`,
      [key]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PUT /api/whatsapp-templates/:key
const updateTemplate = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { body, name, description } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'El cuerpo del mensaje es obligatorio' });
    }

    const before = await pool.query(
      'SELECT * FROM whatsapp_templates WHERE key = $1',
      [key]
    );
    if (before.rows.length === 0) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    const result = await pool.query(
      `UPDATE whatsapp_templates
       SET body = COALESCE($1, body),
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE key = $4
       RETURNING *`,
      [body, name, description, key]
    );

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'whatsapp_template',
      entityId: result.rows[0].id,
      description: `Editó la plantilla de WhatsApp "${result.rows[0].name}"`,
      oldData: { body: before.rows[0].body },
      newData: { body },
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllTemplates, getTemplateByKey, updateTemplate };