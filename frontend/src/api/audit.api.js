import axiosClient from './axiosClient';

export const auditApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.action) params.append('action', filters.action);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.limit) params.append('limit', filters.limit);
    return axiosClient.get(`/audit?${params.toString()}`);
  },

  getStats: () => axiosClient.get('/audit/stats'),

  getEntityHistory: (entity, entityId) =>
    axiosClient.get(`/audit/entity/${entity}/${entityId}`),
};