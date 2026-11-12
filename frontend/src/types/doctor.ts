export type AccessStatus = "Active" | "Expired" | "Revoked";

export interface DoctorProfile {
  name: string;
  email: string;
  registrationNumber: string;
  specialisation: string;
  organisation: string;
}

export interface RecentPatient {
  id: string;
  name: string;
  lastAccessed: string;
  status: AccessStatus;
}

export interface AccessHistoryEntry extends RecentPatient {
  accessedAt: string;
  method: "QR scan" | "Manual code";
  expiresAt: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
}

export interface MedicalTimelineEntry {
  id: string;
  date: string;
  event: string;
  description?: string;
  source?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  startDate?: string;
  endDate?: string;
  status: "Current" | "Stopped" | "Changed" | "Unknown";
}

export interface Allergy {
  id: string;
  name: string;
  severity?: string;
  source?: string;
}

export interface Investigation {
  id: string;
  name: string;
  date: string;
  result?: string;
  unit?: string;
  source?: string;
}

export interface Prescription {
  id: string;
  date: string;
  doctor?: string;
  medicationDetails?: string;
  document?: string;
}

import type { ContradictionItem } from "./clinical";

export interface MedicalDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  url?: string;
}

export interface PatientRecords {
  profile: PatientProfile;
  timeline: MedicalTimelineEntry[];
  medications: Medication[];
  allergies: Allergy[];
  investigations: Investigation[];
  prescriptions: Prescription[];
  documents: MedicalDocument[];
  conflicts?: ContradictionItem[];
}
