import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
    <h1 className="text-6xl font-light text-sana-400 mb-2">404</h1>
    <p className="text-sana-600 mb-6">Página no encontrada</p>
    <Link to="/dashboard" className="btn-primary">
      Volver al inicio
    </Link>
  </div>
);

export default NotFoundPage;