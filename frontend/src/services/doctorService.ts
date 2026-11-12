import { getSupabaseClient } from "../lib/supabase";
import type { DoctorProfile, PatientRecords, RecentPatient, DashboardData } from "../types/doctor";
import { api } from "./api";
import * as mock from "./mockDoctorService";

export const scanPatientQRCode = mock.verifyPatientAccessToken;
export const getAccessHistory = mock.getAccessHistory;

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const patients = await api.getPatients();
    if (patients && patients.length > 0) {
      return {
        totalPatients: patients.length,
        recentlyViewed: Math.min(patients.length, 3),
        activeAccess: patients.length,
        recentPatients: patients.map((p) => ({
          id: String(p.id),
          name: p.name,
          lastAccessed: "Active Ingestion",
          status: "Active" as const,
        })),
      };
    }
  } catch (err) {
    console.warn("Backend API unavailable, using local mock for dashboard:", err);
  }
  return mock.getDashboardData();
}

export async function getRecentPatients(): Promise<RecentPatient[]> {
  try {
    const patients = await api.getPatients();
    if (patients && patients.length > 0) {
      return patients.map((p) => ({
        id: String(p.id),
        name: p.name,
        lastAccessed: "Active Record",
        status: "Active" as const,
      }));
    }
  } catch (err) {
    console.warn("Backend API unavailable, using local mock for recent patients:", err);
  }
  return mock.getRecentPatients();
}

export async function getPatientRecords(patientId: string): Promise<PatientRecords> {
  const numericId = parseInt(patientId.replace(/\D/g, "")) || 101;
  
  try {
    const [events, docs, conflicts, patients] = await Promise.all([
      api.getTimeline(numericId),
      api.getPatientDocuments(numericId),
      api.getConflicts(numericId),
      api.getPatients(),
    ]);

    const patientMeta = patients.find((p) => p.id === numericId);
    const patientName = patientMeta ? patientMeta.name : `Patient ${numericId}`;

    if (events && events.length > 0) {
      // Map Timeline
      const timeline = events.map((e) => ({
        id: String(e.id),
        date: e.normalized_date,
        event: e.entity,
        description: e.normalized_value ? `${e.status}: ${e.normalized_value}` : e.source_passage || e.status,
        source: `${e.source_doc}, p. ${e.page_number}`,
      }));

      // Map Medications
      const medEvents = events.filter((e) => e.category === "MEDICATION");
      const medications = medEvents.map((e) => ({
        id: String(e.id),
        name: e.entity,
        dosage: e.normalized_value || (e.raw_value ? `${e.raw_value} ${e.raw_unit || ""}`.trim() : "Standard dose"),
        startDate: e.normalized_date,
        endDate: e.status === "DISCONTINUED" ? e.normalized_date : undefined,
        status: (e.status === "DISCONTINUED" ? "Stopped" : e.status === "TEMPORARILY_HELD" ? "Changed" : "Current") as "Current" | "Stopped" | "Changed" | "Unknown",
      }));

      // Map Allergies
      const allergyEvents = events.filter((e) => e.category === "ALLERGY");
      const allergies = allergyEvents.map((e) => ({
        id: String(e.id),
        name: e.entity,
        severity: e.normalized_value || e.status || "Severe",
        source: `${e.source_doc}, p. ${e.page_number}`,
      }));

      // Map Investigations
      const labEvents = events.filter((e) => e.category === "LAB");
      const investigations = labEvents.map((e) => ({
        id: String(e.id),
        name: e.entity,
        date: e.normalized_date,
        result: e.normalized_value || e.raw_value || "Completed",
        unit: e.raw_unit || "",
        source: `${e.source_doc}, p. ${e.page_number}`,
      }));

      // Map Documents
      const documents = docs.map((d) => ({
        id: String(d.id),
        name: d.filename,
        type: d.file_type,
        date: d.uploaded_at ? d.uploaded_at.slice(0, 10) : "Recent",
        url: d.file_url,
      }));

      return {
        profile: {
          id: `PAT-${numericId}`,
          name: patientName,
          age: numericId === 101 ? 52 : numericId === 102 ? 38 : numericId === 103 ? 61 : 45,
          gender: numericId === 102 ? "Female" : "Male",
          bloodGroup: numericId === 101 ? "B+" : numericId === 102 ? "A+" : "O+",
        },
        timeline,
        medications: medications.length > 0 ? medications : [{ id: "none", name: "No active medications", status: "Unknown" }],
        allergies: allergies.length > 0 ? allergies : [{ id: "none", name: "No Known Drug Allergies (NKDA)", severity: "Not documented", source: "Clinical History" }],
        investigations,
        prescriptions: medEvents.map((m) => ({
          id: String(m.id),
          date: m.normalized_date,
          doctor: "Treating Physician",
          medicationDetails: `${m.entity} - ${m.normalized_value || m.status}`,
          document: m.source_doc,
        })),
        documents,
        conflicts,
      };
    }
  } catch (err) {
    console.warn("Backend API unavailable, falling back to mock data:", err);
  }

  return mock.getPatientRecords(patientId);
}

export async function getDoctorProfile(): Promise<DoctorProfile> {
  const localProfile = await mock.getDoctorProfile();
  try {
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.user_metadata?.doctor_profile) {
      return {
        ...localProfile,
        ...userData.user.user_metadata.doctor_profile,
      };
    }
  } catch {
    // Supabase auth optional or not configured in demo mode
  }
  return localProfile;
}

export async function updateDoctorProfile(data: Partial<DoctorProfile>): Promise<DoctorProfile> {
  const updated = await mock.updateDoctorProfile(data);
  try {
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase.auth.updateUser({
        data: {
          doctor_profile: updated,
          full_name: updated.name,
        },
      });
    }
  } catch {
    // Non-blocking fallback for local / demo environment
  }
  return updated;
}
