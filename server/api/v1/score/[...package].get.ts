// server/api/v1/score/[...package].get.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/v1/score/:package
// GET /api/v1/score/:package@:version
// GET /api/v1/score/@scope/:package
// GET /api/v1/score/@scope/:package@:version
//
// The primary API endpoint. Returns a PulseScore.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { defineEventHandler, getRouterParams, getQuery, createError } from 'h3'
import { fetchPackageData } from '~/server/utils/npm-registry'
import { fetchGitHubData } from '~/server/utils/github'
import { fetchSecurityData } from '~/server/utils/security'
import { calculateScore } from '~/server/utils/scoring-engine'
import { getCachedScore, setCachedScore } from '~/server/utils/cache'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INPUT VALIDATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// npm package names can contain: a-z, 0-9, @, /, _, -, and .
// Max length: 214 characters (npm spec)
// Must reject path traversal attempts like ../../ or ../etc/passwd
const VALID_PACKAGE_NAME_REGEX = /^(@?[a-z0-9._-]+\/)*[a-z0-9._-]+$/i
const MAX_PACKAGE_NAME_LENGTH = 214

function validatePackageName(name: string): boolean {
  // Check length
  if (!name || name.length > MAX_PACKAGE_NAME_LENGTH) {
    return false
  }

  // Reject path traversal attempts
  if (name.includes('..') || name.includes('./') || name.includes('\\')) {
    return false
  }

  // Validate characters (must match npm spec)
  return VALID_PACKAGE_NAME_REGEX.test(name)
}

export default defineEventHandler(async (event) => {
  // Parse the package name from the catch-all route
  const params = getRouterParams(event)
  const rawPath = params.package || params._ || ''
  const segments = Array.isArray(rawPath) ? rawPath : rawPath.split('/')

  // Reconstruct package name (handle @scope/name)
  let fullName = segments.join('/')
  let requestedVersion: string | undefined

  // Check for @version suffix: "react@18.2.0" or "@nuxt/kit@3.0.0"
  const lastSegment = segments[segments.length - 1]
  if (lastSegment && lastSegment.includes('@') && !lastSegment.startsWith('@')) {
    const atIndex = lastSegment.lastIndexOf('@')
    const name = lastSegment.substring(0, atIndex)
    requestedVersion = lastSegment.substring(atIndex + 1)
    segments[segments.length - 1] = name
    fullName = segments.join('/')
  }

  // Also accept ?version= query param
  const query = getQuery(event)
  if (query.version && typeof query.version === 'string') {
    requestedVersion = query.version
  }

  // Validate package name (SECURITY: prevent path traversal and injection)
  if (!validatePackageName(fullName)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid package name',
    })
  }

  try {
    // ── Step 1: Check cache ──
    const packageVersion = requestedVersion || 'latest'
    const cached = await getCachedScore(fullName, packageVersion)

    if (cached && !cached.isStale) {
      return cached.score
    }

    // ── Step 2: Fetch npm registry data ──
    const npmData = await fetchPackageData(fullName)
    const version = requestedVersion || npmData.version

    // Re-check cache with resolved version
    if (packageVersion === 'latest' && version) {
      const cachedResolved = await getCachedScore(fullName, version)
      if (cachedResolved && !cachedResolved.isStale) {
        return cachedResolved.score
      }
    }

    // ── Step 3: Parallel enrichment (GitHub + Security + Downloads) ──
    const { fetchDownloads } = await import('~/server/utils/npm-registry')

    const [downloads, security, github] = await Promise.all([
      fetchDownloads(fullName),
      fetchSecurityData(fullName, version),
      npmData.repository?.provider === 'github' && npmData.repository.owner && npmData.repository.repo
        ? fetchGitHubData(npmData.repository.owner, npmData.repository.repo)
        : Promise.resolve(null),
    ])

    // ── Step 4: Calculate score ──
    const score = calculateScore(npmData, downloads, security, github)

    // ── Step 5: Cache the result ──
    setCachedScore(fullName, version, score) // fire-and-forget
    if (packageVersion === 'latest') {
      setCachedScore(fullName, 'latest', score) // also cache under "latest"
    }

    // ── Step 6: Return ──
    return score
  }
  catch (error: any) {
    // Package not found
    if (error.statusCode === 404 || error.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: `Package "${fullName}" not found in the npm registry`,
      })
    }

    // If we have stale cache, serve it during errors
    if (cached?.score) {
      return cached.score
    }

    // SECURITY: Don't expose internal error details or stack traces in production
    const isDev = process.env.NODE_ENV === 'development'
    const errorData = isDev ? { detail: error.message } : undefined

    throw createError({
      statusCode: 502,
      statusMessage: `Failed to analyze package "${fullName}"`,
      data: errorData,
    })
  }
})
