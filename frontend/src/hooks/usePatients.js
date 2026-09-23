import { useState, useEffect, useCallback } from 'react';
import { patientsApi } from '../api/patients.api';

export const usePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await patientsApi.getAll(search);
      setPatients(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return { patients, loading, error, fetchPatients };
};