import axiosClient from './axiosClient';

export const prescriptionsApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.patient_id) params.append('patient_id', filters.patient_id);
    if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);
    if (filters.medical_record_id) params.append('medical_record_id', filters.medical_record_id);
    return axiosClient.get(`/prescriptions?${params.toString()}`);
  },

  getPatientPrescriptions: (patientId) =>
    axiosClient.get(`/prescriptions/patient/${patientId}`),

  create: (data) => axiosClient.post('/prescriptions', data),
};