import axiosClient from './axiosClient';

export const waitlistApi = {
  getAll: (status = 'WAITING') => axiosClient.get(`/waitlist?status=${status}`),
  create: (data) => axiosClient.post('/waitlist', data),
  updateStatus: (id, status) => axiosClient.patch(`/waitlist/${id}/status`, { status }),
  delete: (id) => axiosClient.delete(`/waitlist/${id}`),
};