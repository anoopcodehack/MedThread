import { getSupabaseClient } from "../lib/supabase";
import type { UserRole } from "../types/auth";

export const PENDING_SIGNUP_ROLE_KEY = "medthread.pendingSignupRole";

export function getRoleLandingPath(role?: string): string {
  return role === "doctor" ? "/doctor" : "/patient";
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Authentication succeeded without a user.");
  return data.user;
}

export async function signUpWithEmail(input: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        role: input.role,
      },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  return {
    user: data.user,
    confirmationRequired: !data.session,
  };
}

export const signInWithGoogle = async (signupRole?: UserRole) => {
  if (signupRole) {
    sessionStorage.setItem(PENDING_SIGNUP_ROLE_KEY, signupRole);
  }

  const { error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    sessionStorage.removeItem(PENDING_SIGNUP_ROLE_KEY);
    throw error;
  }
};