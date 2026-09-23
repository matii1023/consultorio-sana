require('dotenv').config();
const pool = require('./src/config/db');
const { hashPassword } = require('./src/utils/bcrypt');

(async () => {
  try {
    const username = 'admin';
    const email = 'admin@sana.local';  // correo interno
    const password = '1234';
    const firstName = 'Admin';
    const lastName = 'Sistema';

    // 1. Verificar si ya existe
    const existing = await pool.query(
      'SELECT id, email FROM users WHERE email = $1 OR email = $2',
      [email, username]
    );

    const hash = await hashPassword(password);

    if (existing.rows.length > 0) {
      // Actualizar el existente
      await pool.query(
        `UPDATE users
         SET email = $1,
             password_hash = $2,
             role = 'ADMIN',
             first_name = $3,
             last_name = $4,
             is_active = TRUE,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [email, hash, firstName, lastName, existing.rows[0].id]
      );
      console.log('✅ Admin actualizado:');
    } else {
      // Crear nuevo
      await pool.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
         VALUES ($1, $2, 'ADMIN', $3, $4, TRUE)`,
        [email, hash, firstName, lastName]
      );
      console.log('✅ Admin creado:');
    }

    console.log('   Usuario:  admin');
    console.log('   Password: 1234');
    console.log('   (El email interno es admin@sana.local)');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
})();