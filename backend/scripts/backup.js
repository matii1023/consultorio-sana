require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = path.resolve(__dirname, '../../backups');
const DAYS_TO_KEEP = 30;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

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

const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
const command = `pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -F c -f "${filepath}"`;

console.log('🔄 Iniciando backup...');
console.log(`   Base de datos: ${DB_NAME}`);
console.log(`   Destino: ${filepath}`);

exec(command, { env }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error en backup:', error.message);
    process.exit(1);
  }

  const stats = fs.statSync(filepath);
  console.log(`✅ Backup completado: ${(stats.size / 1024).toFixed(2)} KB`);

  // Limpiar backups antiguos
  const files = fs.readdirSync(BACKUP_DIR);
  const cutoff = Date.now() - DAYS_TO_KEEP * 24 * 60 * 60 * 1000;
  let deleted = 0;

  files.forEach((f) => {
    const fp = path.join(BACKUP_DIR, f);
    const st = fs.statSync(fp);
    if (st.mtimeMs < cutoff) {
      fs.unlinkSync(fp);
      deleted++;
    }
  });

  if (deleted > 0) {
    console.log(`🧹 ${deleted} backup(s) antiguo(s) eliminado(s)`);
  }

  process.exit(0);
});