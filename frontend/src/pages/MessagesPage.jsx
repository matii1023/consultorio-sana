import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import axiosClient from '../api/axiosClient';

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadMessages = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'unprocessed') params.processed = 'false';
      if (filter === 'processed') params.processed = 'true';

      const { data } = await axiosClient.get('/whatsapp/messages', { params });
      setMessages(data);
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const intentConfig = {
    CONFIRM: { label: 'Confirmó', color: 'badge-confirmed', icon: '✅' },
    CANCEL: { label: 'Canceló', color: 'badge-cancelled', icon: '❌' },
    OTHER: { label: 'Otro', color: 'badge-pending', icon: '💬' },
  };

  const unprocessedCount = messages.filter(
    (m) => !m.processed && m.intent === 'OTHER'
  ).length;

  return (
    <DashboardLayout>
      <Header
        title="Mensajes WhatsApp"
        subtitle={`${messages.length} mensaje${messages.length !== 1 ? 's' : ''} recibido${messages.length !== 1 ? 's' : ''}`}
      />

      <div className="p-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${filter === 'all'
                ? 'bg-sana-500 text-white shadow-soft'
                : 'bg-white text-sana-600 hover:bg-sana-50 border border-sana-100'
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('unprocessed')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition relative
              ${filter === 'unprocessed'
                ? 'bg-sana-500 text-white shadow-soft'
                : 'bg-white text-sana-600 hover:bg-sana-50 border border-sana-100'
              }`}
          >
            Sin procesar
            {unprocessedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs 
                               rounded-full w-5 h-5 flex items-center justify-center">
                {unprocessedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('processed')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${filter === 'processed'
                ? 'bg-sana-500 text-white shadow-soft'
                : 'bg-white text-sana-600 hover:bg-sana-50 border border-sana-100'
              }`}
          >
            Procesados
          </button>
        </div>

        {loading ? (
          <Card><Loader text="Cargando mensajes..." /></Card>
        ) : messages.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-sana-700 mb-2">
                No hay mensajes
              </h3>
              <p className="text-sm text-sana-400">
                Los mensajes de WhatsApp de los pacientes aparecerán aquí
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const intent = intentConfig[msg.intent] || intentConfig.OTHER;
              const date = new Date(msg.created_at).toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card key={msg.id} className="border border-sana-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-sana-100 text-sana-600 
                                    flex items-center justify-center text-xl flex-shrink-0">
                      {intent.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sana-800">
                            {msg.patient_first_name
                              ? `${msg.patient_first_name} ${msg.patient_last_name}`
                              : `+${msg.from_number}`}
                          </p>
                          <p className="text-xs text-sana-400 mt-0.5">{date}</p>
                        </div>
                        <span className={intent.color}>{intent.label}</span>
                      </div>

                      <div className="mt-3 p-3 rounded-xl bg-sana-50 border border-sana-100">
                        <p className="text-sm text-sana-700">{msg.body}</p>
                      </div>

                      {msg.appointment_date && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-sana-500">
                          <span>📅 Cita:</span>
                          <span className="font-medium capitalize">
                            {new Date(msg.appointment_date).toLocaleString('es-AR', {
                              day: '2-digit',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <Badge status={msg.appointment_status} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;