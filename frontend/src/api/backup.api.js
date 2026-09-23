import axiosClient from './axiosClient';

export const backupApi = {
  list: () => axiosClient.get('/backups'),

  create: () => axiosClient.post('/backups'),

  download: async (filename) => {
    const response = await axiosClient.get(`/backups/${filename}`, {
      responseType: 'blob',
    });

    // Crear link de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};