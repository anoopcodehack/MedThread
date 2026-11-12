import axios from 'axios';
import { TimelineEventItem, ContradictionItem, QAResponse } from '../types/clinical';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getTimeline: async (patientId: number): Promise<TimelineEventItem[]> => {
    const res = await client.get(`/timeline/${patientId}`);
    return res.data;
  },

  getConflicts: async (patientId: number): Promise<ContradictionItem[]> => {
    const res = await client.get(`/conflicts/${patientId}`);
    return res.data;
  },

  askQuestion: async (patientId: number, question: string): Promise<QAResponse> => {
    const res = await client.post('/qa', { patient_id: patientId, question });
    return res.data;
  },

  reviewEvent: async (eventId: number, payload: { reviewer_name: string; field_modified: string; new_value: string; reason?: string }) => {
    const res = await client.patch(`/review/${eventId}`, payload);
    return res.data;
  },

  uploadDocument: async (patientId: number, file: File) => {
    const formData = new FormData();
    formData.append('patient_id', patientId.toString());
    formData.append('file', file);
    const res = await client.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
