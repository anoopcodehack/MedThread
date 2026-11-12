import axios from 'axios';
import type {
  ContradictionItem,
  PatientDocument,
  PatientSummary,
  QAResponse,
  SeedPatientResponse,
  SignedDocumentUrl,
  TimelineEventItem,
} from '../types/clinical';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getPatients: async (): Promise<PatientSummary[]> => {
    const res = await client.get<PatientSummary[]>('/patients');
    return res.data;
  },

  seedPatientData: async (patientId: number): Promise<SeedPatientResponse> => {
    const res = await client.post<SeedPatientResponse>(`/seed/${patientId}`);
    return res.data;
  },

  getTimeline: async (patientId: number): Promise<TimelineEventItem[]> => {
    const res = await client.get<TimelineEventItem[]>(`/timeline/${patientId}`);
    return res.data;
  },

  getConflicts: async (patientId: number): Promise<ContradictionItem[]> => {
    const res = await client.get<ContradictionItem[]>(`/conflicts/${patientId}`);
    return res.data;
  },

  getPatientDocuments: async (patientId: number): Promise<PatientDocument[]> => {
    const res = await client.get<PatientDocument[]>(`/documents/${patientId}`);
    return res.data;
  },

  getSignedDocumentUrl: async (
    patientId: number,
    filename: string,
    expiresIn = 3600,
  ): Promise<SignedDocumentUrl> => {
    const res = await client.post<SignedDocumentUrl>('/documents/signed-url', {
      patient_id: patientId,
      filename,
      expires_in: expiresIn,
    });
    const baseUrl = `${API_BASE.replace(/\/+$/, '')}/`;
    return {
      ...res.data,
      signed_url: new URL(res.data.signed_url, baseUrl).toString(),
    };
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
