import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const LoginPage = () => {
 const [email, setEmail] = useState('admin');  // opcional, prellenado
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sana-50 to-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sana-400 to-sana-600 flex items-center justify-center shadow-card">
              <span className="text-white text-3xl font-light">+s</span>
            </div>
          </div>
          <h1 className="text-3xl font-light text-sana-700 tracking-tight">+sana</h1>
          <p className="text-xs tracking-[0.3em] text-sana-400 mt-1">
            SALUD Y BIENESTAR INTEGRAL
          </p>
        </div>

        {/* Card del formulario */}
        <div className="card">
          <h2 className="text-xl font-semibold text-sana-800 mb-1">
            Bienvenido de vuelta
          </h2>
          <p className="text-sm text-sana-400 mb-6">
            Ingresa tus credenciales para acceder
          </p>

          <form onSubmit={handleSubmit}>
            <Input
  label="Usuario"
  name="email"
  type="text"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="admin"
  required
/>
            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-xs text-center text-sana-400 mt-6">
            ¿Olvidaste tu contraseña? Contacta al administrador
          </p>
        </div>

        <p className="text-center text-xs text-sana-300 mt-6">
          © 2026 +sana · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
};

export default LoginPage;