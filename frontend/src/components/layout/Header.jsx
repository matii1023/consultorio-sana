import { useAuth } from '../../context/AuthContext';
import GlobalSearch from './GlobalSearch';

const Header = ({ title, subtitle, hideSearch = false }) => {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Disparar el evento de Ctrl+K
  const openCommandPalette = () => {
    // Simular la pulsación de Ctrl+K
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="bg-white border-b border-sana-100 px-8 py-5 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-sana-800">{title}</h1>
          {subtitle && <p className="text-sm text-sana-400 mt-0.5">{subtitle}</p>}
        </div>

        {!hideSearch && (
          <button
            onClick={openCommandPalette}
            className="hidden md:flex items-center gap-2 flex-1 max-w-md 
                       px-4 py-2 rounded-xl border border-sana-200 
                       hover:border-sana-400 hover:bg-sana-50/50 transition
                       text-left text-sm text-sana-400"
          >
            <span>🔍</span>
            <span className="flex-1">Buscar...</span>
            <kbd className="text-[10px] bg-sana-50 px-2 py-0.5 rounded border border-sana-200">
              Ctrl+K
            </kbd>
          </button>
        )}

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium text-sana-700">
            Hola, {user?.first_name} 👋
          </p>
          <p className="text-xs text-sana-400 capitalize">{today}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;