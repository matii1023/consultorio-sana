const pool = require('../config/db');

// GET /api/audit
// Query params: ?entity=patient&user_id=...&action=CREATE&from=2026-01-01&to=2026-12-31&limit=100
const getAuditLogs = async (req, res, next) => {
  try {
    const { entity, user_id, action, from, to, limit = 100 } = req.query;

    let query = `
      SELECT
        id, user_id, user_email, user_role,
        action, entity, entity_id,
        description, old_data, new_data,
        ip_address, created_at
      FROM audit_logs
      WHERE 1 = 1
    `;
    const params = [];
    let i = 1;

    if (entity) {
      query += ` AND entity = $${i++}`;
      params.push(entity);
    }
    if (user_id) {
      query += ` AND user_id = $${i++}`;
      params.push(user_id);
    }
    if (action) {
      query += ` AND action = $${i++}`;
      params.push(action);
    }
    if (from) {
      query += ` AND created_at >= $${i++}`;
      params.push(from);
    }
    if (to) {
      query += ` AND created_at <= $${i++}`;
      params.push(to);
    }

    query += ` ORDER BY created_at DESC LIMIT $${i++}`;
    params.push(parseInt(limit) || 100);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/audit/stats
// Devuelve estadísticas agregadas de auditoría
const getAuditStats = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         entity,
         action,
         COUNT(*)::int AS count
       FROM audit_logs
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY entity, action
       ORDER BY entity, action`
    );

    // Agrupar por entidad
    const stats = {};
    result.rows.forEach((row) => {
      if (!stats[row.entity]) {
        stats[row.entity] = { entity: row.entity, total: 0, actions: {} };
      }
      stats[row.entity].actions[row.action] = row.count;
      stats[row.entity].total += row.count;
    });

    res.json(Object.values(stats));
  } catch (error) {
    next(error);
  }
};

// GET /api/audit/entity/:entity/:entityId
// Devuelve el historial de cambios de una entidad específica
const getEntityHistory = async (req, res, next) => {
  try {
    const { entity, entityId } = req.params;

    // Buscar logs donde entity_id = entityId
    // Y también logs relacionados (ej: medical_record vinculado a un patient)
    let query = `
      SELECT
        id, user_email, user_role, action, entity, entity_id,
        description, old_data, new_data, created_at
      FROM audit_logs
      WHERE entity = $1 AND entity_id = $2
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query, [entity, entityId]);

    // Si es un paciente, también buscar los logs de sus registros clínicos
    // y recetas (para tener el historial completo)
    let relatedLogs = [];
    if (entity === 'patient') {
      const relatedQuery = `
        SELECT
          al.id, al.user_email, al.user_role, al.action, al.entity,
          al.entity_id, al.description, al.created_at
        FROM audit_logs al
        WHERE al.entity IN ('medical_record', 'prescription')
          AND al.new_data::text LIKE $1
        ORDER BY al.created_at DESC
        LIMIT 50
      `;
      // El JSONB contiene patient_id
      const related = await pool.query(relatedQuery, [`%${entityId}%`]);
      relatedLogs = related.rows;
    }

    // Combinar y ordenar por fecha
    const combined = [...result.rows, ...relatedLogs]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 100);

    res.json(combined);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs, getAuditStats, getEntityHistory };