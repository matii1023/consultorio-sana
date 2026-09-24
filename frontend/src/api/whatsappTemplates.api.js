import axiosClient from './axiosClient';

export const whatsappTemplatesApi = {
  getAll: () => axiosClient.get('/whatsapp-templates'),
  getByKey: (key) => axiosClient.get(`/whatsapp-templates/${key}`),
  update: (key, data) => axiosClient.put(`/whatsapp-templates/${key}`, data),
};