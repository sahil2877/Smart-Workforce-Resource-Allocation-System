import { supabase } from './client'

export const initSupabaseAuth = () => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      console.log('Supabase auth event:', event)
    }
  })
}

export const refreshSupabaseSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()

  if (error) {
    console.error('Failed to refresh Supabase session:', error.message)
    throw error
  }

  return data
}
