/**
 * api.js  –  Supabase-backed data adapter
 *
 * Exposes the same api.get / api.put interface that useStore.js uses,
 * but reads/writes from the Supabase `app_data` table instead of Express.
 *
 * Also re-exports audit helpers used by UserManagement.
 */
import { supabase } from '../lib/supabase'

// ─── Data API ────────────────────────────────────────────────────────────────

export const api = {
  /**
   * GET /data          → returns { project, valueCase, … } (all modules)
   * GET /data/:module  → returns the module object directly
   */
  get: async (path) => {
    const parts  = path.replace(/^\//, '').split('/')   // ['data'] or ['data','valueCase']
    const module = parts[1]                             // undefined or 'valueCase' etc.

    if (module) {
      const { data, error } = await supabase
        .from('app_data')
        .select('data')
        .eq('module', module)
        .single()
      if (error) throw new Error(error.message)
      return data?.data ?? null
    }

    // Return all modules as a single merged object
    const { data: rows, error } = await supabase
      .from('app_data')
      .select('module, data')
    if (error) throw new Error(error.message)

    return rows.reduce((acc, row) => {
      acc[row.module] = row.data
      return acc
    }, {})
  },

  /**
   * PUT /data/:module  { ...payload }  → upserts the module row
   */
  put: async (path, body) => {
    const module = path.replace(/^\/data\//, '')
    const { error } = await supabase
      .from('app_data')
      .upsert({ module, data: body }, { onConflict: 'module' })
    if (error) throw new Error(error.message)
    return { ok: true }
  },

  post: async (path, body) => {
    console.warn('[VRO] api.post not implemented for Supabase mode:', path, body)
    return { ok: true }
  },

  delete: async (path) => {
    console.warn('[VRO] api.delete not implemented for Supabase mode:', path)
    return { ok: true }
  },
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export async function writeAudit({ action, targetUser, details }) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_log').insert({
    actor_id:    user?.id,
    actor_email: user?.email,
    action,
    target_user: targetUser,
    details,
  })
}

export async function readAudit(limit = 200) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data
}
