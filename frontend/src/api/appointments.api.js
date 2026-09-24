import axiosClient from './axiosClient';

export const appointmentsApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.date)       params.append('date', filters.date);
    if (filters.doctor_id)  params.append('doctor_id', filters.doctor_id);
    if (filters.patient_id) params.append('patient_id', filters.patient_id);
    if (filters.status)     params.append('status', filters.status);
    return axiosClient.get(`/appointments?${params.toString()}`);
  },

  getWeek: (date) => axiosClient.get(`/appointments/week?date=${date}`),

  getStats: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return axiosClient.get(`/appointments/stats?${params.toString()}`);
  },

  getById: (id) => axiosClient.get(`/appointments/${id}`),
  create: (data) => axiosClient.post('/appointments', data),
  update: (id, data) => axiosClient.put(`/appointments/${id}`, data),
  updateStatus: (id, status) =>
    axiosClient.patch(`/appointments/${id}/status`, { status }),
  reschedule: (id, data) =>
    axiosClient.patch(`/appointments/${id}/reschedule`, data),
  cancel: (id) => axiosClient.delete(`/appointments/${id}`),

  // WhatsApp con preview y edición
  getTicketPreview: (id) =>
    axiosClient.get(`/whatsapp/preview-ticket/${id}`),

  getReminderPreview: (id) =>
    axiosClient.get(`/whatsapp/preview-reminder/${id}`),

  sendEditedMessage: (phone, body, appointment_id) =>
    axiosClient.post('/whatsapp/send-edited', { phone, body, appointment_id }),

  sendTicketByWhatsApp: (id) =>
    axiosClient.post(`/whatsapp/send-ticket/${id}`),

  sendReminderByWhatsApp: (id) =>
    axiosClient.post(`/whatsapp/send-reminder/${id}`),

  sendBulkReminders: () =>
    axiosClient.post('/whatsapp/send-bulk-reminders'),
};