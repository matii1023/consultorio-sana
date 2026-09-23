import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsApi } from '../../api/patients.api';
import { doctorsApi } from '../../api/doctors.api';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ patients: [], doctors: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce de búsqueda
  useEffect(() => {
    if (query.length < 2) {
      setResults({ patients: [], doctors: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [patRes, docRes] = await Promise.all([
          patientsApi.getAll(query),
          doctorsApi.getAll(),
        ]);

        // Filtrar doctores localmente (el backend no soporta búsqueda todavía)
        const q = query.toLowerCase();
        const filteredDoctors = docRes.data.filter(
          (d) =>
            d.first_name?.toLowerCase().includes(q) ||
            d.last_name?.toLowerCase().includes(q) ||
            d.specialty_name?.toLowerCase().includes(q) ||
            d.license_number?.toLowerCase().includes(q)
        );

        setResults({
          patients: patRes.data.slice(0, 5),
          doctors: filteredDoctors.slice(0, 3),
        });
      } catch (err) {
        console.error('Error en búsqueda:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPatient = (patient) => {
    setQuery('');
    setOpen(false);
    navigate(`/patients/${patient.id}`);
  };

  const handleSelectDoctor = () => {
    setQuery('');
    setOpen(false);
    navigate('/doctors');
  };

  const hasResults =
    results.patients.length > 0 || results.doctors.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar pacientes, médicos..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-sana-200 
                     focus:border-sana-500 focus:ring-2 focus:ring-sana-200 
                     focus:outline-none transition-all text-sm bg-white"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sana-400 text-sm">
          🔍
        </span>
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl 
                        shadow-xl border border-sana-100 z-50 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-sana-400">Buscando...</div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-sm text-sana-400">
              Sin resultados para "{query}"
            </div>
          ) : (
            <div className="py-2">
              {results.patients.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-sana-400 uppercase tracking-wide">
                    Pacientes
                  </p>
                  {results.patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className="w-full text-left px-4 py-2 hover:bg-sana-50 transition flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sana-300 to-sana-500 
                                      flex items-center justify-center text-white text-xs font-medium">
                        {p.first_name?.[0]}{p.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sana-800 truncate">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-xs text-sana-400 truncate">
                          Doc: {p.document_id}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.doctors.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-sana-400 uppercase tracking-wide">
                    Médicos
                  </p>
                  {results.doctors.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDoctor(d)}
                      className="w-full text-left px-4 py-2 hover:bg-sana-50 transition flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sana-300 to-sana-500 
                                      flex items-center justify-center text-white text-xs font-medium">
                        {d.first_name?.[0]}{d.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sana-800 truncate">
                          Dr. {d.first_name} {d.last_name}
                        </p>
                        <p className="text-xs text-sana-400 truncate">
                          {d.specialty_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;