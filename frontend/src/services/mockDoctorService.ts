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
  conflicts: [
    {
      id: 1,
      patient_id: 101,
      tier: "DIRECT_CONFLICT",
      category: "MEDICATION",
      entity: "Aspirin",
      description: "Direct contradiction: Apollo Cardiology resumed Aspirin 75mg daily on 2024-03-12, but Fortis Surgical paused it on 2024-03-05.",
      doc1_name: "01_Discharge_Summary_Fortis_2024.pdf",
      quote1: "Aspirin 75mg: Temporarily held prior to transurethral surgery.",
      doc2_name: "04_Cardiology_Followup_Apollo_2024.pdf",
      quote2: "Aspirin 75mg daily: Resumed cardioprotective antiplatelet therapy.",
      resolved: 0,
    },
    {
      id: 2,
      patient_id: 101,
      tier: "NEEDS_REVIEW",
      category: "ALLERGY",
      entity: "Penicillin",
      description: "Discrepancy: City Hospital 2021 documented Penicillin allergy (anaphylaxis), whereas 2023 Health Camp documented NKDA.",
      doc1_name: "03_Allergy_Intake_CityHospital_2021.pdf",
      quote1: "Severe allergy to Penicillin: generalized rash and angioedema in 2018.",
      doc2_name: "05_Annual_Health_Checkup_2023.pdf",
      quote2: "Allergies: No Known Drug Allergies (NKDA).",
      resolved: 0,
    },
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
  let localResolvedMap: Record<string, any> = {};
  let localOverridesMap: Record<string, any> = {};
  try {
    if (typeof window !== "undefined") {
      localResolvedMap = JSON.parse(localStorage.getItem("medthread_resolved_conflicts") || "{}");
      localOverridesMap = JSON.parse(localStorage.getItem("medthread_timeline_overrides") || "{}");
    }
  } catch {}

  const mappedConflicts = (records.conflicts || []).map((c) => {
    const entityKey = (c.entity || "").toLowerCase().trim();
    const isLocallyResolved = Boolean(
      localResolvedMap[entityKey]?.resolved ||
      (c.id && localResolvedMap[String(c.id)]?.resolved) ||
      localOverridesMap[entityKey] ||
      (entityKey.includes("aspirin") && (localOverridesMap["aspirin"] || localOverridesMap["39"]))
    );
    return {
      ...c,
      resolved: c.resolved ? 1 : isLocallyResolved ? 1 : 0,
    };
  });

  return {
    ...records,
    conflicts: mappedConflicts,
  };
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
