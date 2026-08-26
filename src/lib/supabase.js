import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const BUCKET = 'flow-media';

// ── Upload a local File to Supabase, return public URL ──
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

// ── Upload any file (image, pdf, video) to Supabase, return public URL ──
export async function uploadMediaFile(file, folder = 'media') {
  if (!supabase) throw new Error('Supabase not configured');
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// ── Fetch remote URL, re-upload to Supabase, return new URL ──
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

// ── Extract storage path from a Supabase public URL ──
export function extractStoragePath(url) {
  if (!url || !supabase) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length).split('?')[0];
}

// ── Delete a file by its full Supabase URL ──
export async function deleteMediaByUrl(url) {
  const path = extractStoragePath(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

// ── Delete a file by storage path ──
export async function deleteTemplateMedia(path) {
  if (!supabase || !path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

// ── List all files in a folder ──
export async function listMediaFiles(folder = 'media') {
  if (!supabase) return [];
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) return [];
  return (data || []).map((f) => {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(`${folder}/${f.name}`);
    return { name: f.name, path: `${folder}/${f.name}`, url: urlData?.publicUrl, created_at: f.created_at };
  });
}

// ── Replace an existing file (delete old, upload new) ──
export async function replaceMediaFile(oldUrl, newFile, folder = 'media') {
  await deleteMediaByUrl(oldUrl);
  return uploadMediaFile(newFile, folder);
}
