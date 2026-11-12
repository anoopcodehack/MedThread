import { getSupabaseClient } from "../lib/supabase";

export const signInWithGoogle = async () => {
  const { error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    throw error;
  }
};