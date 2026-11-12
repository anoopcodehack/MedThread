import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://znwoerjmclnajtxhecek.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5OTLaoxwRRuMelY4NyzNxw_ilO0MdVT';
export const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'patient-records';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Resolves a document path to a previewable URL:
 * - If already a full URL (Supabase Storage public URL), returns directly.
 * - If local relative path, resolves against local backend or Supabase CDN.
 */
export function resolveDocumentUrl(pathOrUrl: string, patientId?: number, filename?: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  
  // If we have patientId and filename, check Supabase Storage public URL
  if (patientId && filename) {
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(`${patientId}/${filename}`);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  }

  // Fallback to local backend raw streamer
  const backendBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const root = backendBase.replace(/\/api$/, '');
  return `${root}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/**
 * Uploads a medical file directly to Supabase Storage bucket
 */
export async function uploadPatientFileToSupabase(patientId: number, file: File) {
  const filePath = `${patientId}/${file.name}`;
  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.warn('Supabase client upload failed, backend will use local fallback:', error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(filePath);

  return urlData?.publicUrl || null;
}
