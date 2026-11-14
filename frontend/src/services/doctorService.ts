import { getSupabaseClient } from "../lib/supabase";
import type { DoctorProfile, PatientRecords, RecentPatient, DashboardData } from "../types/doctor";
import { api } from "./api";
import * as mock from "./mockDoctorService";

export async function scanPatientQRCode(token: string): Promise<{ patientId: string }> {
  if (!token || !token.trim()) {
    throw new Error("Enter or scan a patient access code.");
  }
  const clean = token.trim();
  const match = clean.match(/(\d{3})/);
  if (match) {
    return { patientId: match[1] };
  }
  return mock.verifyPatientAccessToken(token);
}

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
        source: `${e.source_doc} (Page ${e.page_number || 1})`,
        quote: e.source_passage,
        isReviewed: Boolean(e.is_reviewed),
        reviewedOverride: e.reviewed_override,
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
        source: `${e.source_doc} (Page ${e.page_number || 1})`,
        quote: e.source_passage,
        isReviewed: Boolean(e.is_reviewed),
        reviewedOverride: e.reviewed_override,
      }));

      // Map Allergies
      const allergyEvents = events.filter((e) => e.category === "ALLERGY");
      const allergies = allergyEvents.map((e) => ({
        id: String(e.id),
        name: e.entity,
        severity: e.normalized_value || e.status || "Severe",
        source: `${e.source_doc} (Page ${e.page_number || 1})`,
        quote: e.source_passage,
      }));

      // Map Investigations
      const labEvents = events.filter((e) => e.category === "LAB");
      const investigations = labEvents.map((e) => {
        let displayResult = e.normalized_value || e.raw_value || "Completed";
        if (
          e.raw_value && 
          e.raw_unit && 
          e.normalized_value && 
          !e.normalized_value.toLowerCase().includes(e.raw_unit.toLowerCase())
        ) {
          displayResult = `${e.normalized_value} (raw: ${e.raw_value} ${e.raw_unit})`;
        }
        return {
          id: String(e.id),
          name: e.entity,
          date: e.normalized_date,
          result: displayResult,
          unit: "",
          source: `${e.source_doc} (Page ${e.page_number || 1})`,
          quote: e.source_passage,
        };
      });

      // Map Documents
      const documents = docs.map((d) => ({
        id: String(d.id),
        name: d.filename,
        type: d.file_type,
        date: d.uploaded_at ? d.uploaded_at.slice(0, 10) : "Recent",
        url: d.file_url,
      }));

      // Reconcile conflicts with local overrides & resolved status
      let localResolvedMap: Record<string, any> = {};
      let localOverridesMap: Record<string, any> = {};
      try {
        if (typeof window !== "undefined") {
          localResolvedMap = JSON.parse(localStorage.getItem("medthread_resolved_conflicts") || "{}");
          localOverridesMap = JSON.parse(localStorage.getItem("medthread_timeline_overrides") || "{}");
        }
      } catch {}

      const mappedConflicts = (conflicts || []).map((c) => {
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
        conflicts: mappedConflicts,
      };
    }
  } catch (err) {
    console.warn("Backend API unavailable, falling back to mock data:", err);
  }

  return mock.getPatientRecords(patientId);
}

export async function getAllDoctors(): Promise<DoctorProfile[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('doctors').select('*').order('id', { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        email: d.email,
        registrationNumber: d.registration_number,
        specialisation: d.specialisation,
        organisation: d.organisation,
        department: d.department,
        queueDepth: d.queue_depth,
        status: d.status,
        phone: d.phone,
        verified: Boolean(d.verified),
      }));
    }
  } catch (err) {
    console.warn("Supabase doctors table query fallback:", err);
  }

  // Fallback to backend API
  try {
    const backendDocs = await api.getDoctors();
    if (backendDocs && backendDocs.length > 0) {
      return backendDocs;
    }
  } catch {}

  // Standard verified specialists fallback
  return [
    {
      id: 1,
      name: "Dr. Ananya Rao",
      email: "doctor@medthread.io",
      registrationNumber: "MCI-KA-2018-44912",
      specialisation: "Cardiology",
      organisation: "Apollo Heart Institute",
      department: "Interventional Cardiology",
      queueDepth: 5,
      status: "OVERLOADED",
      verified: true,
    },
    {
      id: 2,
      name: "Dr. Suresh Menon",
      email: "suresh.menon@manipal.edu",
      registrationNumber: "MCI-KA-2016-19284",
      specialisation: "Cardiology",
      organisation: "Manipal Hospital",
      department: "Cardiology & Triage",
      queueDepth: 1,
      status: "AVAILABLE",
      verified: true,
    },
    {
      id: 3,
      name: "Dr. Kavita Shenoy",
      email: "kavita.shenoy@fortis.in",
      registrationNumber: "MCI-KA-2020-77192",
      specialisation: "Pulmonology",
      organisation: "Fortis Hospital",
      department: "Pulmonology & Critical Care",
      queueDepth: 2,
      status: "AVAILABLE",
      verified: true,
    },
    {
      id: 4,
      name: "Dr. Vikrant Mehta",
      email: "v.mehta@maxhealth.in",
      registrationNumber: "MCI-DL-2015-88120",
      specialisation: "Endocrinology",
      organisation: "Max Healthcare",
      department: "Endocrinology & Diabetology",
      queueDepth: 3,
      status: "AVAILABLE",
      verified: true,
    },
    {
      id: 5,
      name: "Dr. Rajesh Iyer",
      email: "r.iyer@aiims.edu",
      registrationNumber: "MCI-DL-2011-30911",
      specialisation: "Internal Medicine",
      organisation: "AIIMS New Delhi",
      department: "General & Internal Medicine",
      queueDepth: 0,
      status: "AVAILABLE",
      verified: true,
    },
  ];
}

export async function getDoctorProfile(): Promise<DoctorProfile> {
  const localProfile = await mock.getDoctorProfile();
  try {
    const supabase = getSupabaseClient();

    // 1. Try querying Supabase 'doctors' table
    const { data: dbDoctor, error } = await supabase
      .from('doctors')
      .select('*')
      .or(`email.eq.${localProfile.email},email.eq.doctor@medthread.io`)
      .limit(1)
      .maybeSingle();

    if (!error && dbDoctor) {
      const merged: DoctorProfile = {
        ...localProfile,
        id: dbDoctor.id,
        name: dbDoctor.name,
        email: dbDoctor.email,
        registrationNumber: dbDoctor.registration_number,
        specialisation: dbDoctor.specialisation,
        organisation: dbDoctor.organisation,
        department: dbDoctor.department,
        queueDepth: dbDoctor.queue_depth,
        status: dbDoctor.status,
        phone: dbDoctor.phone,
        verified: Boolean(dbDoctor.verified),
      };
      return merged;
    }

    // 2. Try user auth metadata
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.user_metadata?.doctor_profile) {
      return {
        ...localProfile,
        ...userData.user.user_metadata.doctor_profile,
      };
    }
  } catch (err) {
    console.warn("Supabase doctor profile fetch fallback:", err);
  }
  return localProfile;
}

export async function updateDoctorProfile(data: Partial<DoctorProfile>): Promise<DoctorProfile> {
  const updated = await mock.updateDoctorProfile(data);
  try {
    const supabase = getSupabaseClient();

    // 1. Persist directly to Supabase 'doctors' table
    const doctorPayload = {
      name: updated.name,
      email: updated.email,
      registration_number: updated.registrationNumber,
      specialisation: updated.specialisation,
      organisation: updated.organisation,
      department: updated.department || "Cardiology",
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from('doctors')
      .upsert(doctorPayload, { onConflict: 'email' });

    if (upsertErr) {
      console.warn("Supabase doctors upsert warning:", upsertErr);
    } else {
      console.log("Doctor profile saved to Supabase 'doctors' table successfully!");
    }

    // 2. Also sync to Auth user metadata
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase.auth.updateUser({
        data: {
          doctor_profile: updated,
          full_name: updated.name,
        },
      });
    }
  } catch (err) {
    console.warn("Supabase doctor save non-blocking fallback:", err);
  }

  // 3. Sync to backend API if active
  if (updated.id && typeof updated.id === "number") {
    try {
      await api.updateDoctor(updated.id, updated);
    } catch {}
  }

  return updated;
}

export async function updateDoctorQueueInSupabase(
  doctorId: number,
  queueDepth: number,
  status?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('doctors').update({
      queue_depth: queueDepth,
      status: status || (queueDepth > 4 ? 'OVERLOADED' : 'AVAILABLE'),
      updated_at: new Date().toISOString(),
    }).eq('id', doctorId);
  } catch (err) {
    console.warn("Could not sync doctor queue to Supabase:", err);
  }
}
