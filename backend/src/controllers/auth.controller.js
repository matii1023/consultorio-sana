const pool = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { signToken } = require('../utils/jwt');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { email, password, role, first_name, last_name, phone } = req.body;

    if (!email || !password || !role || !first_name || !last_name) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, first_name, last_name, phone, created_at`,
      [email, passwordHash, role, first_name, last_name, phone || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }

    // Normalizar: si no tiene @, agregar el dominio interno
    if (!email.includes('@')) {
      email = `${email}@sana.local`;
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'Usuario desactivado' });
    }

    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    next(error);
  }
};
// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, first_name, last_name, phone, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, me };