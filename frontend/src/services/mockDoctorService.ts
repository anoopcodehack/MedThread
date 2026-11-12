import type {
  AccessHistoryEntry,
  DoctorProfile,
  PatientRecords,
  RecentPatient,
} from "../types/doctor";

const recentPatients: RecentPatient[] = [
  { id: "MT-20481", name: "Rajesh Sharma", lastAccessed: "Today, 10:42 AM", status: "Active" },
  { id: "MT-19822", name: "Priya Patel", lastAccessed: "Yesterday, 3:15 PM", status: "Active" },
  { id: "MT-17604", name: "Vikram Malhotra", lastAccessed: "12 Jun 2025", status: "Expired" },
];

const accessHistory: AccessHistoryEntry[] = recentPatients.map((patient, index) => ({
  ...patient,
  accessedAt: patient.lastAccessed,
  method: index === 1 ? "Manual code" : "QR scan",
  expiresAt: index === 2 ? "Expired" : "In 6 hours",
}));

const records: PatientRecords = {
  profile: { id: "MT-20481", name: "Rajesh Sharma", age: 48, gender: "Male", bloodGroup: "O+" },
  timeline: [
    { id: "1", date: "18 Jun 2025", event: "Discharge summary", description: "Follow-up after cardiac evaluation.", source: "discharge-summary.pdf, p. 2" },
    { id: "2", date: "14 Jun 2025", event: "Lipid panel", description: "Total cholesterol: 198 mg/dL.", source: "lab-report-june.pdf, p. 1" },
    { id: "3", date: "02 Jun 2025", event: "Prescription issued", description: "Medication details available below.", source: "prescription-020625.pdf, p. 1" },
  ],
  medications: [
    { id: "1", name: "Atorvastatin", dosage: "10 mg once daily", startDate: "02 Jun 2025", status: "Current" },
    { id: "2", name: "Aspirin", dosage: "75 mg once daily", startDate: "02 Jun 2025", status: "Current" },
    { id: "3", name: "Medication not documented", status: "Unknown" },
  ],
  allergies: [{ id: "1", name: "Penicillin", severity: "Not documented", source: "intake-form.pdf, p. 1" }],
  investigations: [{ id: "1", name: "Lipid panel", date: "14 Jun 2025", result: "198", unit: "mg/dL", source: "lab-report-june.pdf" }],
  prescriptions: [{ id: "1", date: "02 Jun 2025", doctor: "Dr. Ananya Rao", medicationDetails: "Atorvastatin 10 mg once daily; Aspirin 75 mg once daily", document: "prescription-020625.pdf" }],
  documents: [
    { id: "1", name: "Discharge summary", type: "Discharge summary", date: "18 Jun 2025" },
    { id: "2", name: "June lab report", type: "Lab report", date: "14 Jun 2025" },
  ],
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function verifyPatientAccessToken(token: string): Promise<{ patientId: string }> {
  await wait(500);
  if (!token.trim()) {
    throw new Error("Enter or scan a patient access code.");
  }
  return { patientId: records.profile.id };
}

export async function getDashboardData() {
  await wait(150);
  return { recentPatients, totalPatients: 24, recentlyViewed: 8, activeAccess: 3 };
}

export async function getRecentPatients() {
  await wait(150);
  return recentPatients;
}

export async function getAccessHistory() {
  await wait(150);
  return accessHistory;
}

export async function getPatientRecords(_patientId: string) {
  await wait(150);
  return records;
}

const DOCTOR_PROFILE_STORAGE_KEY = "medthread_doctor_profile";

const defaultDoctorProfile: DoctorProfile = {
  name: "Dr. Ananya Rao",
  email: "ananya.rao@example.com",
  registrationNumber: "MCI-20145",
  specialisation: "Internal Medicine",
  organisation: "MedThread Care Clinic",
};

let inMemoryDoctorProfile: DoctorProfile = { ...defaultDoctorProfile };

export function getStoredDoctorProfile(): DoctorProfile {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(DOCTOR_PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return { ...defaultDoctorProfile, ...parsed };
        }
      }
    } catch {
      // fallback to in-memory state
    }
  }
  return inMemoryDoctorProfile;
}

export async function getDoctorProfile(): Promise<DoctorProfile> {
  await wait(100);
  inMemoryDoctorProfile = getStoredDoctorProfile();
  return { ...inMemoryDoctorProfile };
}

export async function updateDoctorProfile(data: Partial<DoctorProfile>): Promise<DoctorProfile> {
  await wait(150);
  const current = getStoredDoctorProfile();
  inMemoryDoctorProfile = {
    ...current,
    ...data,
  };
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(
        DOCTOR_PROFILE_STORAGE_KEY,
        JSON.stringify(inMemoryDoctorProfile)
      );
      window.dispatchEvent(
        new CustomEvent("medthread_doctor_profile_updated", {
          detail: inMemoryDoctorProfile,
        })
      );
    } catch {
      // ignore storage failure
    }
  }
  return { ...inMemoryDoctorProfile };
}
