// Supabase session refresh helper
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znwoerjmclnajtxhecek.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5OTLaoxwRRuMelY4NyzNxw_ilO0MdVT';

export const getSupabaseSession = async (token?: string) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user;
  }
  return null;
};
