import { useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { useBrowserNotifications } from './useBrowserNotifications';

/**
 * Hace polling cada 30 segundos para detectar nuevos mensajes de WhatsApp
 * y mostrar notificaciones del navegador.
 */
export const useWhatsAppPolling = (enabled = true) => {
  const { notify } = useBrowserNotifications();
  const lastMessageIdRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const checkMessages = async () => {
      try {
        const { data } = await axiosClient.get('/whatsapp/messages', {
          params: { limit: 5 },
        });

        if (data.length === 0) return;

        const latest = data[0];

        if (lastMessageIdRef.current && latest.id !== lastMessageIdRef.current) {
          const intentLabels = {
            CONFIRM: '✅ confirmó',
            CANCEL: '❌ canceló',
            OTHER: 'envió un mensaje',
          };

          const patientName = latest.patient_first_name
            ? `${latest.patient_first_name} ${latest.patient_last_name}`
            : `+${latest.from_number}`;

          notify(`💬 ${patientName}`, {
            body: `${intentLabels[latest.intent] || 'escribió'}: "${latest.body.substring(0, 80)}"`,
            tag: 'whatsapp-message',
          });
        }

        lastMessageIdRef.current = latest.id;
      } catch (err) {
        // Silencioso
      }
    };

    const initialTimer = setTimeout(checkMessages, 10000);
    intervalRef.current = setInterval(checkMessages, 30000);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, notify]);
};