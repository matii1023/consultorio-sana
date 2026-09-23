import axiosClient from './axiosClient';

export const doctorsApi = {
  getAll: () => axiosClient.get('/doctors'),
  getById: (id) => axiosClient.get(`/doctors/${id}`),
  create: (data) => axiosClient.post('/doctors', data),
  update: (id, data) => axiosClient.put(`/doctors/${id}`, data),
  delete: (id) => axiosClient.delete(`/doctors/${id}`),
};