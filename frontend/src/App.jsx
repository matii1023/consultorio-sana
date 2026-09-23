import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;