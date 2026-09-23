import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsApi } from '../../api/patients.api';
import { doctorsApi } from '../../api/doctors.api';
import { useAuth } from '../../context/AuthContext';

const CommandPalette = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Abrir con Ctrl+K / Cmd+K (con listener nativo para interceptar el navegador)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K o Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setOpen((prev) => !prev);
        return false;
      }
      // Escape para cerrar
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open]);

  // Cargar pacientes y médicos al abrir
  useEffect(() => {
    if (!open) return;
    if (patients.length > 0 || doctors.length > 0) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        const [patRes, docRes] = await Promise.all([
          patientsApi.getAll(),
          doctorsApi.getAll(),
        ]);
        setPatients(patRes.data);
        setDoctors(docRes.data);
      } catch (err) {
        console.error('Error cargando datos del buscador:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [open, patients.length, doctors.length]);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Páginas de navegación
  const navItems = useMemo(() => {
    const items = [
      { type: 'page', label: 'Ir a Inicio', icon: '🏠', path: '/dashboard', roles: ['ADMIN', 'SECRETARY', 'DOCTOR'] },
      { type: 'page', label: 'Ir a Citas', icon: '📅', path: '/appointments', roles: ['ADMIN', 'SECRETARY', 'DOCTOR'] },
      { type: 'page', label: 'Ir a Pacientes', icon: '👥', path: '/patients', roles: ['ADMIN', 'SECRETARY', 'DOCTOR'] },
      { type: 'page', label: 'Ir a Mensajes', icon: '💬', path: '/messages', roles: ['ADMIN', 'SECRETARY'] },
      { type: 'page', label: 'Ir a Médicos', icon: '👨‍⚕️', path: '/doctors', roles: ['ADMIN'] },
      { type: 'page', label: 'Ir a Especialidades', icon: '🩺', path: '/specialties', roles: ['ADMIN'] },
      { type: 'page', label: 'Ir a Usuarios', icon: '👤', path: '/users', roles: ['ADMIN'] },
      { type: 'page', label: 'Ir a Auditoría', icon: '📜', path: '/audit', roles: ['ADMIN'] },
      { type: 'page', label: 'Ir a Backups', icon: '🛡️', path: '/backups', roles: ['ADMIN'] },
      { type: 'action', label: 'Nueva cita', icon: '➕', path: '/appointments', roles: ['ADMIN', 'SECRETARY'] },
      { type: 'action', label: 'Nuevo paciente', icon: '➕', path: '/patients', roles: ['ADMIN', 'SECRETARY'] },
      { type: 'action', label: 'Nuevo médico', icon: '➕', path: '/doctors', roles: ['ADMIN'] },
    ];
    return items.filter((item) => item.roles.includes(user?.role));
  }, [user]);

  // Construir resultados
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = [];

    if (!q) {
      navItems.forEach((item) =>
        list.push({ ...item, id: `nav-${item.path}-${item.label}` })
      );
      return list.slice(0, 10);
    }

    patients.forEach((p) => {
      const matches =
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.document_id?.toLowerCase().includes(q) ||
        p.phone?.includes(q);
      if (matches) {
        list.push({
          id: `patient-${p.id}`,
          type: 'patient',
          label: `${p.first_name} ${p.last_name}`,
          description: `Doc: ${p.document_id} · ${p.phone}`,
          icon: '👤',
          path: `/patients/${p.id}`,
        });
      }
    });

    doctors.forEach((d) => {
      const matches =
        d.first_name?.toLowerCase().includes(q) ||
        d.last_name?.toLowerCase().includes(q) ||
        d.specialty_name?.toLowerCase().includes(q) ||
        d.license_number?.toLowerCase().includes(q);
      if (matches) {
        list.push({
          id: `doctor-${d.id}`,
          type: 'doctor',
          label: `Dr. ${d.first_name} ${d.last_name}`,
          description: `${d.specialty_name} · Mat. ${d.license_number}`,
          icon: '👨‍⚕️',
          path: '/doctors',
        });
      }
    });

    navItems.forEach((item) => {
      if (item.label.toLowerCase().includes(q)) {
        list.push({ ...item, id: `nav-${item.path}-${item.label}` });
      }
    });

    return list.slice(0, 15);
  }, [query, patients, doctors, navItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const handleKeyDownInput = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex];
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (item) => {
    setOpen(false);
    setQuery('');
    navigate(item.path);
  };

  const groupedResults = useMemo(() => {
    const groups = {};
    results.forEach((item) => {
      const group = item.type || 'page';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [results]);

  const groupLabels = {
    patient: 'Pacientes',
    doctor: 'Médicos',
    page: 'Páginas',
    action: 'Acciones',
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] 
                 bg-sana-900/40 backdrop-blur-sm px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl 
                   overflow-hidden border border-sana-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sana-100">
          <span className="text-xl text-sana-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Buscar pacientes, médicos, páginas o acciones..."
            className="flex-1 text-base outline-none placeholder:text-sana-300 
                       text-sana-800 bg-transparent"
          />
          <kbd className="hidden sm:inline-block text-[10px] text-sana-400 
                          bg-sana-50 px-2 py-1 rounded border border-sana-200">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {loadingData && results.length === 0 ? (
            <div className="text-center py-8 text-sm text-sana-400">Cargando...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">🔎</div>
              <p className="text-sm text-sana-400">Sin resultados para "{query}"</p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([group, items]) => (
              <div key={group}>
                <p className="px-5 py-2 text-[10px] font-semibold text-sana-400 
                              uppercase tracking-widest">
                  {groupLabels[group] || group}
                </p>
                {items.map((item) => {
                  const globalIndex = results.indexOf(item);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full text-left px-5 py-3 flex items-center gap-3 transition
                        ${isSelected ? 'bg-sana-50' : 'hover:bg-sana-50/50'}`}
                    >
                      <span className="text-xl flex-shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sana-800 truncate">
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-xs text-sana-400 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-xs text-sana-400 flex-shrink-0">↵</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-sana-100 px-5 py-2 flex items-center 
                        justify-between text-[10px] text-sana-400 bg-sana-50/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-sana-200">↑</kbd>
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-sana-200">↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-sana-200">↵</kbd>
              abrir
            </span>
          </div>
          <span className="hidden sm:flex items-center gap-1">
            <kbd className="bg-white px-1.5 py-0.5 rounded border border-sana-200">Ctrl</kbd>
            <span>+</span>
            <kbd className="bg-white px-1.5 py-0.5 rounded border border-sana-200">K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;