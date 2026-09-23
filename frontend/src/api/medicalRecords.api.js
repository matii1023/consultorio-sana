import axiosClient from './axiosClient';

export const medicalRecordsApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.patient_id)     params.append('patient_id', filters.patient_id);
    if (filters.doctor_id)      params.append('doctor_id', filters.doctor_id);
    if (filters.appointment_id) params.append('appointment_id', filters.appointment_id);
    return axiosClient.get(`/medical-records?${params.toString()}`);
  },

  getById: (id) => axiosClient.get(`/medical-records/${id}`),

  getPatientHistory: (patientId) =>
    axiosClient.get(`/medical-records/patient/${patientId}/history`),

  create: (data) => axiosClient.post('/medical-records', data),

  update: (id, data) => axiosClient.put(`/medical-records/${id}`, data),

  delete: (id) => axiosClient.delete(`/medical-records/${id}`),
};