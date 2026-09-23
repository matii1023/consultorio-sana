import { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    clinic_name: '+sana Consultorio Médico',
    clinic_address: '',
    clinic_phone: '',
    clinic_email: '',
    clinic_website: '',
    clinic_tax_id: '',
    logo_url: '',
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data } = await axiosClient.get('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Error cargando settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const updateSettings = async (newSettings) => {
    const { data } = await axiosClient.put('/settings', newSettings);
    setSettings(data);
    return data;
  };

  return (
    <SettingsContext.Provider
      value={{ settings, loading, updateSettings, refresh: loadSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return ctx;
};