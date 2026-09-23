const pool = require('../config/db');

const logAudit = async ({
  req,
  action,
  entity,
  entityId,
  description,
  oldData = null,
  newData = null,
}) => {
  try {
    const user = req.user || {};
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    await pool.query(
      `INSERT INTO audit_logs 
         (user_id, user_email, user_role, action, entity, entity_id, description, old_data, new_data, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        user.id || null,
        user.email || null,
        user.role || null,
        action,
        entity,
        entityId || null,
        description,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ip,
      ]
    );
  } catch (error) {
    console.error('⚠️ Error registrando auditoría:', error.message);
  }
};

module.exports = { logAudit };