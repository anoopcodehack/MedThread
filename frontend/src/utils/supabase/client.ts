import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znwoerjmclnajtxhecek.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5OTLaoxwRRuMelY4NyzNxw_ilO0MdVT';

export const createClientHelper = () =>
  createClient(
    supabaseUrl,
    supabaseKey
  );

export const supabase = createClientHelper();
