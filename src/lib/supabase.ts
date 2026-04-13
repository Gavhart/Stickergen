import { createClient } from '@supabase/supabase-js'
import type { Profile, Sticker } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars. Copy .env.example to .env.local and fill in your values.')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

// -- Auth helpers ------------------------------------------------------------
export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({ email, password })

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/create` },
  })

export const signOut = () => supabase.auth.signOut()

// -- Profile helpers ---------------------------------------------------------
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data as Profile
}

export const upsertProfile = async (profile: Partial<Profile> & { id: string }) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() })
    .select()
    .single()
  return { data: data as Profile | null, error }
}

export const uploadAvatar = async (userId: string, file: File) => {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) return { url: null, error }
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// -- Sticker helpers ---------------------------------------------------------
export const saveSticker = async (
  userId: string,
  base64: string,
  meta: { prompt: string; style: string; color: string; provider: string }
) => {
  // Convert base64 to blob and upload to storage
  const byteString = atob(base64)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
  const blob = new Blob([ab], { type: 'image/png' })

  const filename = `${userId}/${Date.now()}.png`
  const { error: uploadError } = await supabase.storage
    .from('stickers')
    .upload(filename, blob, { contentType: 'image/png' })
  if (uploadError) return { data: null, error: uploadError }

  const { data: urlData } = supabase.storage.from('stickers').getPublicUrl(filename)

  const { data, error } = await supabase
    .from('stickers')
    .insert({ user_id: userId, image_url: urlData.publicUrl, ...meta })
    .select()
    .single()
  return { data: data as Sticker | null, error }
}

export const getStickers = async (userId: string): Promise<Sticker[]> => {
  const { data, error } = await supabase
    .from('stickers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Sticker[]
}

export const deleteSticker = async (sticker: Sticker) => {
  // Remove from storage
  const path = sticker.image_url.split('/stickers/')[1]
  if (path) await supabase.storage.from('stickers').remove([path])
  // Remove from DB
  return supabase.from('stickers').delete().eq('id', sticker.id)
}
