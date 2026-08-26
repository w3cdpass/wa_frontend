import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const BUCKET = 'flow-media';

export async function uploadTemplateImage(file) {
  if (!supabase) throw new Error('Supabase not configured');
  const ext = file.name.split('.').pop() || 'png';
  const path = `templates/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'image/png',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadTemplateMediaFromUrl(url) {
  if (!supabase || !url) return url;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return url;
    const blob = await resp.blob();
    const ext = url.split('.').pop()?.split('?')[0] || 'png';
    const path = `templates/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: blob.type || 'image/png',
      upsert: false,
    });
    if (error) return url;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return url;
  }
}

export async function deleteTemplateMedia(path) {
  if (!supabase || !path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

