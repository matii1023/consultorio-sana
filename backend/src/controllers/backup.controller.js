const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { logAudit } = require('../services/audit.service');

const BACKUP_DIR = path.resolve(__dirname, '../../../backups');

// Asegurar que exista el directorio
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Ejecuta un backup manual de la base de datos.
 */
const createBackup = async (req, res, next) => {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const filename = `consultorio_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const {
      DB_USER,
      DB_PASSWORD,
      DB_HOST,
      DB_PORT,
      DB_NAME,
    } = process.env;

    // Configurar PGPASSWORD en el entorno del comando
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

    const command = `pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -F c -f "${filepath}"`;

    exec(command, { env }, async (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error en backup:', error.message);
        return res.status(500).json({
          message: 'Error al crear el backup',
          detail: error.message,
        });
      }

      // Obtener tamaño del archivo
      const stats = fs.statSync(filepath);

      await logAudit({
        req,
        action: 'CREATE',
        entity: 'backup',
        description: `Creó backup manual: ${filename} (${(stats.size / 1024).toFixed(2)} KB)`,
      });

      res.json({
        message: 'Backup creado exitosamente',
        filename,
        size: stats.size,
        createdAt: new Date().toISOString(),
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista todos los backups disponibles.
 */
const listBackups = async (req, res, next) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json([]);
    }

    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql') || f.endsWith('.dump'))
      .map((f) => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(files);
  } catch (error) {
    next(error);
  }
};

/**
 * Descarga un backup específico.
 */
const downloadBackup = async (req, res, next) => {
  try {
    const { filename } = req.params;

    // Validar nombre para evitar path traversal
    if (!/^[\w\-\.]+\.(sql|dump)$/.test(filename)) {
      return res.status(400).json({ message: 'Nombre de archivo inválido' });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Backup no encontrado' });
    }

    res.download(filepath, filename);
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina backups antiguos (más de 30 días).
 */
const cleanupOldBackups = async () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let deleted = 0;

    files.forEach((f) => {
      const filepath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(filepath);

      if (stats.mtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filepath);
        deleted++;
      }
    });

    console.log(`🧹 Limpieza de backups: ${deleted} archivo(s) eliminado(s)`);
  } catch (error) {
    console.error('Error limpiando backups:', error.message);
  }
};

module.exports = {
  createBackup,
  listBackups,
  downloadBackup,
  cleanupOldBackups,
};