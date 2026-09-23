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

  getById: (id) => axiosClient.get(`/appointments/${id}`),

  create: (data) => axiosClient.post('/appointments', data),

  update: (id, data) => axiosClient.put(`/appointments/${id}`, data),

  updateStatus: (id, status) =>
    axiosClient.patch(`/appointments/${id}/status`, { status }),

  cancel: (id) => axiosClient.delete(`/appointments/${id}`),
};