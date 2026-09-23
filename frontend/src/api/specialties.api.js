import axiosClient from './axiosClient';

export const specialtiesApi = {
  getAll: () => axiosClient.get('/specialties'),
  getById: (id) => axiosClient.get(`/specialties/${id}`),
  create: (data) => axiosClient.post('/specialties', data),
  update: (id, data) => axiosClient.put(`/specialties/${id}`, data),
  delete: (id) => axiosClient.delete(`/specialties/${id}`),
};