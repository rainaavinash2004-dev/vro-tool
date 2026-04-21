import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ─── Helper: fetch (or auto-create) the profile row for the current user ─────
async function fetchProfile(userId, userEmail) {
  // maybeSingle() returns null instead of throwing when 0 rows found
  const { data, error } = await supabase
    .from('profiles')
    .select('role, display_name, must_change_pwd, is_active')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)

  // No profile row yet — create one on the fly so login is never blocked
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id:              userId,
        email:           userEmail,
        display_name:    userEmail,
        role:            'viewer',
        is_active:       true,
        must_change_pwd: false,
      }, { onConflict: 'id' })
      .select('role, display_name, must_change_pwd, is_active')
      .single()
    if (insertError) throw new Error(insertError.message)
    return created
  }

  return data
}

// ─── Build a normalised user object ──────────────────────────────────────────
function buildUser(session, profile) {
  return {
    id:                 session.user.id,
    email:              session.user.email,          // email always comes from the Auth session
    displayName:        profile.display_name || session.user.email,
    role:               profile.role,
    mustChangePassword: profile.must_change_pwd,
    isActive:           profile.is_active ?? true,   // defaults true if column not yet present
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
      const profile = await fetchProfile(session.user.id, session.user.email)
      set({ user: buildUser(session, profile), loading: false, error: null })
    } catch {
      set({ user: null, loading: false })
    }

    // Listen for sign-in / sign-out events (e.g. token refresh, other tabs)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) { set({ user: null }); return }
      try {
        const profile = await fetchProfile(session.user.id, session.user.email)
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
    const profile = await fetchProfile(data.user.id, data.user.email)
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
