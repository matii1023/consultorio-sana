import axiosClient from './axiosClient';

export const usersApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    return axiosClient.get(`/users?${params.toString()}`);
  },

  getById: (id) => axiosClient.get(`/users/${id}`),

  create: (data) => axiosClient.post('/users', data),

  update: (id, data) => axiosClient.put(`/users/${id}`, data),

  resetPassword: (id, newPassword) =>
    axiosClient.patch(`/users/${id}/password`, { new_password: newPassword }),

  delete: (id) => axiosClient.delete(`/users/${id}`),
};