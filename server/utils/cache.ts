// server/utils/cache.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Supabase Cache Layer
// Scores are expensive to compute (3-5 API calls)
// Cache for 1 hour, serve stale for 24 hours
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { createClient } from '@supabase/supabase-js'
import type { PulseScore } from '~/types'

let supabase: ReturnType<typeof createClient> | null = null

function getClient() {
  if (supabase) return supabase
  const config = useRuntimeConfig()
  if (!config.supabaseUrl || !config.supabaseServiceKey) return null
  supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
  return supabase
}

const CACHE_TTL_SECONDS = 3600           // 1 hour fresh
const STALE_TTL_SECONDS = 86400          // 24 hours stale-while-revalidate

export async function getCachedScore(
  packageName: string,
  version: string,
): Promise<{ score: PulseScore, isStale: boolean } | null> {
  const client = getClient()
  if (!client) return null

  try {
    type ScoreRow = { score_data: PulseScore; updated_at: string }
    const queryResult = await client
      .from('scores')
      .select('score_data, updated_at')
      .eq('package_name', packageName)
      .eq('version', version)
      .single()
    const data = queryResult.data as ScoreRow | null
    const error = queryResult.error

    if (error || !data) return null

    const updatedAt = new Date(data.updated_at).getTime()
    const age = (Date.now() - updatedAt) / 1000
    const score = data.score_data as PulseScore

    // Beyond stale window — treat as miss
    if (age > STALE_TTL_SECONDS) return null

    // Within fresh window
    const isStale = age > CACHE_TTL_SECONDS
    score.meta.dataAge = Math.round(age)
    score.meta.cacheHit = true

    return { score, isStale }
  }
  catch {
    return null
  }
}

export async function setCachedScore(
  packageName: string,
  version: string,
  score: PulseScore,
): Promise<void> {
  const client = getClient()
  if (!client) return

  try {
    type InsertRow = { package_name: string; version: string; score_data: PulseScore; updated_at: string }
    await (client.from('scores') as unknown as { upsert: (data: InsertRow, opts: { onConflict: string }) => Promise<unknown> }).upsert(
      {
        package_name: packageName,
        version,
        score_data: score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'package_name,version' },
    )
  }
  catch (err) {
    console.warn('Cache write failed:', err)
  }
}

// ──────────────────────────────────
// RATE LIMITING (in-memory for MVP)
// ──────────────────────────────────

const rateLimits = new Map<string, { count: number, resetAt: number }>()

export function checkRateLimit(
  apiKey: string,
  limit: number = 100,
): { allowed: boolean, remaining: number, resetAt: number } {
  const now = Date.now()
  const windowMs = 24 * 60 * 60 * 1000 // 24 hours

  let entry = rateLimits.get(apiKey)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
    rateLimits.set(apiKey, entry)
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  const allowed = entry.count <= limit

  return { allowed, remaining, resetAt: entry.resetAt }
}
