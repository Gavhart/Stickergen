import { createClient } from '@supabase/supabase-js'
import type { Profile, Recipe } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars. Copy .env.example to .env.local and fill in your values.')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

// -- Auth helpers ----------------------------------------------------------
export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({ email, password })

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/feed` },
  })

export const signOut = () => supabase.auth.signOut()

// -- Profile helpers -------------------------------------------------------
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data as Profile | null
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

// -- Recipe helpers --------------------------------------------------------

/** Fetch community feed (public recipes, newest first, with author info) */
export const getFeedRecipes = async (limit = 24, offset = 0): Promise<Recipe[]> => {
  const { data } = await supabase
    .from('recipes')
    .select('*, profiles(username, avatar_url)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  return (data ?? []) as Recipe[]
}

/** Fetch all recipes by a user */
export const getMyRecipes = async (userId: string): Promise<Recipe[]> => {
  const { data } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Recipe[]
}

/** Fetch a single recipe by id */
export const getRecipe = async (id: string): Promise<Recipe | null> => {
  const { data } = await supabase
    .from('recipes')
    .select('*, profiles(username, avatar_url)')
    .eq('id', id)
    .single()
  return data as Recipe | null
}

/** Create a new recipe */
export const createRecipe = async (userId: string, recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'profiles' | 'saves_count' | 'likes_count' | 'is_saved' | 'is_liked'>) => {
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...recipe, user_id: userId })
    .select()
    .single()
  return { data: data as Recipe | null, error }
}

/** Update an existing recipe */
export const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data as Recipe | null, error }
}

/** Delete a recipe */
export const deleteRecipe = async (id: string) =>
  supabase.from('recipes').delete().eq('id', id)

/** Toggle save (bookmark) on a recipe */
export const toggleSave = async (userId: string, recipeId: string, saved: boolean) => {
  if (saved) {
    return supabase.from('saves').delete().match({ user_id: userId, recipe_id: recipeId })
  }
  return supabase.from('saves').insert({ user_id: userId, recipe_id: recipeId })
}

/** Toggle like on a recipe */
export const toggleLike = async (userId: string, recipeId: string, liked: boolean) => {
  if (liked) {
    return supabase.from('likes').delete().match({ user_id: userId, recipe_id: recipeId })
  }
  return supabase.from('likes').insert({ user_id: userId, recipe_id: recipeId })
}

/** Get saved recipe ids for a user */
export const getSavedIds = async (userId: string): Promise<string[]> => {
  const { data } = await supabase.from('saves').select('recipe_id').eq('user_id', userId)
  return (data ?? []).map((r: { recipe_id: string }) => r.recipe_id)
}

/** Get liked recipe ids for a user */
export const getLikedIds = async (userId: string): Promise<string[]> => {
  const { data } = await supabase.from('likes').select('recipe_id').eq('user_id', userId)
  return (data ?? []).map((r: { recipe_id: string }) => r.recipe_id)
}

/** Fetch saved recipes for a user */
export const getSavedRecipes = async (userId: string): Promise<Recipe[]> => {
  const { data } = await supabase
    .from('saves')
    .select('recipe_id, recipes(*, profiles(username, avatar_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r: { recipes: unknown }) => r.recipes as Recipe)
}
