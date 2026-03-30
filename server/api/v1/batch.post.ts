// server/api/v1/batch.post.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/batch
// Body: { packages: [{ package: "react" }, ...] }
// Max 50 packages per request
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { defineEventHandler, readBody, createError } from 'h3'
import type { BatchRequest, PulseScore } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<BatchRequest>(event)

  if (!body?.packages || !Array.isArray(body.packages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Body must contain a "packages" array',
    })
  }

  if (body.packages.length > 50) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Maximum 50 packages per batch request',
    })
  }

  if (body.packages.length === 0) {
    return { results: [], total: 0 }
  }

  // Process in parallel with concurrency limit of 5
  const results: (PulseScore | { package: string, error: string })[] = []
  const batchSize = 5

  for (let i = 0; i < body.packages.length; i += batchSize) {
    const batch = body.packages.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(
      batch.map(async (req) => {
        const name = req.package
        const version = req.version || ''
        const path = version ? `${name}@${version}` : name
        // Internal fetch to our own score endpoint
        return await $fetch<PulseScore>(`/api/v1/score/${path}`)
      }),
    )

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j]
      if (result.status === 'fulfilled') {
        results.push(result.value)
      }
      else {
        results.push({
          package: batch[j].package,
          error: result.reason?.message || 'Analysis failed',
        })
      }
    }
  }

  return {
    results,
    total: results.length,
    analyzedAt: new Date().toISOString(),
  }
})
