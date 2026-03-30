// server/api/v1/compare.get.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/v1/compare?packages=react,vue,svelte
// Compare 2-5 packages side by side
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { defineEventHandler, getQuery, createError } from 'h3'
import type { PulseScore, CompareResponse } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const packagesParam = query.packages

  if (!packagesParam || typeof packagesParam !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query parameter "packages" is required (comma-separated)',
    })
  }

  const packageNames = packagesParam.split(',').map(p => p.trim()).filter(Boolean)

  if (packageNames.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least 2 packages required for comparison',
    })
  }

  if (packageNames.length > 5) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Maximum 5 packages per comparison',
    })
  }

  // Fetch all scores in parallel
  const results = await Promise.allSettled(
    packageNames.map(name => $fetch<PulseScore>(`/api/v1/score/${name}`)),
  )

  const scores: PulseScore[] = []
  const errors: string[] = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'fulfilled') {
      scores.push(result.value)
    }
    else {
      errors.push(`Failed to analyze "${packageNames[i]}": ${result.reason?.message}`)
    }
  }

  if (scores.length < 2) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Could not analyze enough packages for comparison',
      data: { errors },
    })
  }

  // Sort by overall score descending
  scores.sort((a, b) => b.score - a.score)

  // Generate recommendation
  const top = scores[0]
  const recommendation = scores.length >= 2
    ? `${top.package} leads with a Pulse score of ${top.score}/100. `
      + `Strongest in ${getStrongestDimension(top)}.`
    : undefined

  const response: CompareResponse = {
    packages: scores,
    recommendation,
    comparedAt: new Date().toISOString(),
  }

  return response
})

function getStrongestDimension(score: PulseScore): string {
  const dims = score.breakdown
  const entries = [
    { name: 'maintenance', score: dims.maintenance.score },
    { name: 'quality', score: dims.quality.score },
    { name: 'security', score: dims.security.score },
    { name: 'popularity', score: dims.popularity.score },
  ]
  entries.sort((a, b) => b.score - a.score)
  return entries[0].name
}
