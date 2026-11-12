import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://znwoerjmclnajtxhecek.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5OTLaoxwRRuMelY4NyzNxw_ilO0MdVT';

export const supabase = createClient(supabaseUrl, supabaseKey);
export const getSupabaseClient = () => supabase;
