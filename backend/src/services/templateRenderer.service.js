const pool = require('../config/db');

/**
 * Reemplaza los placeholders {{var}} por los valores reales.
 */
const renderTemplate = (template, values) => {
  let output = template;
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    output = output.replace(regex, value != null ? String(value) : '');
  });
  return output;
};

/**
 * Obtiene una plantilla de la BD y la renderiza.
 */
const getRenderedTemplate = async (templateKey, values) => {
  const result = await pool.query(
    'SELECT body FROM whatsapp_templates WHERE key = $1 AND is_active = TRUE',
    [templateKey]
  );

  if (result.rows.length === 0) {
    throw new Error(`Plantilla "${templateKey}" no encontrada o inactiva`);
  }

  return renderTemplate(result.rows[0].body, values);
};

module.exports = { renderTemplate, getRenderedTemplate };