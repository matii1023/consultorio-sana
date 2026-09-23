import axiosClient from './axiosClient';

export const patientsApi = {
  getAll: (search = '') =>
    axiosClient.get('/patients', { params: search ? { search } : {} }),

  getById: (id) => axiosClient.get(`/patients/${id}`),

  create: (data) => axiosClient.post('/patients', data),

  update: (id, data) => axiosClient.put(`/patients/${id}`, data),

  delete: (id) => axiosClient.delete(`/patients/${id}`),

  getHistory: (patientId) =>
    axiosClient.get(`/medical-records/patient/${patientId}/history`),
};