import { getSupabaseClient } from "../lib/supabase";
import type { DoctorProfile } from "../types/doctor";
import * as mock from "./mockDoctorService";

export const scanPatientQRCode = mock.verifyPatientAccessToken;
export const getDashboardData = mock.getDashboardData;
export const getPatientRecords = mock.getPatientRecords;
export const getRecentPatients = mock.getRecentPatients;
export const getAccessHistory = mock.getAccessHistory;

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
