import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ─── Helper: fetch the profile row for the current session user ───────────────
async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, display_name, email, must_change_pwd, is_active')
    .eq('id', userId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ─── Build a normalised user object ──────────────────────────────────────────
function buildUser(session, profile) {
  return {
    id:                 session.user.id,
    email:              session.user.email,
    displayName:        profile.display_name || session.user.email,
    role:               profile.role,
    mustChangePassword: profile.must_change_pwd,
    isActive:           profile.is_active,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
const useAuthStore = create((set, get) => ({
  user:    null,
  loading: true,
  error:   null,

  /**
   * Called once on app mount.
   * Restores session from localStorage (Supabase handles the token automatically)
   * and subscribes to future auth state changes.
   */
  checkAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { set({ loading: false }); return }
      const profile = await fetchProfile(session.user.id)
      set({ user: buildUser(session, profile), loading: false, error: null })
    } catch {
      set({ user: null, loading: false })
    }

    // Listen for sign-in / sign-out events (e.g. token refresh, other tabs)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) { set({ user: null }); return }
      try {
        const profile = await fetchProfile(session.user.id)
        set({ user: buildUser(session, profile) })
      } catch {
        set({ user: null })
      }
    })
  },

  /**
   * Sign in with email + password via Supabase Auth.
   */
  login: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ error: error.message }); throw error }
    const profile = await fetchProfile(data.user.id)
    const user    = buildUser(data.session, profile)
    set({ user, error: null })
    return user
  },

  /**
   * Sign out of Supabase Auth (clears token from localStorage automatically).
   */
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, error: null })
  },

  /**
   * Change the current user's password.
   * Supabase requires the user to be logged in; no "current password" check is
   * done client-side (the session proves identity).
   */
  changePassword: async (_currentPassword, newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
    // Clear the must_change_pwd flag in the profiles table
    const userId = get().user?.id
    if (userId) {
      await supabase.from('profiles').update({ must_change_pwd: false }).eq('id', userId)
    }
    set(s => ({ user: s.user ? { ...s.user, mustChangePassword: false } : null }))
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore

// Convenience hooks
export const useCanEdit = () => {
  const role = useAuthStore(s => s.user?.role)
  return role === 'admin' || role === 'editor'
}
export const useIsAdmin = () => useAuthStore(s => s.user?.role === 'admin')
