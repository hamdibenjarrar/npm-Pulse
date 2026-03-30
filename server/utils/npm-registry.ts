// server/utils/npm-registry.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// npm Registry API Client
// All free, no auth required for read operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import semver from 'semver'
import type {
  NpmPackageData,
  VersionInfo,
  RepositoryInfo,
  DownloadData,
} from '~/types'

const NPM_REGISTRY = 'https://registry.npmjs.org'
const NPM_DOWNLOADS = 'https://api.npmjs.org/downloads'

// ──────────────────────────────────
// PACKAGE METADATA
// ──────────────────────────────────

export async function fetchPackageData(name: string): Promise<NpmPackageData> {
  const encoded = encodeURIComponent(name).replace('%40', '@')
  const url = `${NPM_REGISTRY}/${encoded}`

  const res = await $fetch<any>(url, {
    headers: { Accept: 'application/json' },
    timeout: 15000,
  })

  const latestTag = res['dist-tags']?.latest
  const latestVersion = res.versions?.[latestTag] || {}
  const allVersions = res.versions || {}
  const timeMap = res.time || {}

  // Parse versions into structured data
  const versions: VersionInfo[] = Object.entries(allVersions)
    .filter(([v]) => semver.valid(v))
    .map(([v, data]: [string, any]) => ({
      version: v,
      publishedAt: timeMap[v] || '',
      deprecated: data.deprecated,
      unpackedSize: data.dist?.unpackedSize,
    }))
    .sort((a, b) => semver.rcompare(a.version, b.version))

  // Detect module type
  const moduleType = detectModuleType(latestVersion)

  // Detect TypeScript types
  const hasTypes = detectTypescript(latestVersion, name)

  // Parse repository info
  const repository = parseRepository(latestVersion.repository)

  return {
    name: res.name,
    description: res.description,
    version: latestTag,
    license: latestVersion.license || res.license,
    homepage: latestVersion.homepage || res.homepage,
    repository,
    maintainers: res.maintainers || [],
    keywords: latestVersion.keywords || res.keywords || [],
    dependencies: latestVersion.dependencies || {},
    devDependencies: latestVersion.devDependencies || {},
    peerDependencies: latestVersion.peerDependencies || {},
    versions,
    time: timeMap,
    distTags: res['dist-tags'] || {},
    deprecated: latestVersion.deprecated,
    unpackedSize: latestVersion.dist?.unpackedSize,
    fileCount: latestVersion.dist?.fileCount,
    hasTypes,
    moduleType,
  }
}

// ──────────────────────────────────
// DOWNLOAD COUNTS
// ──────────────────────────────────

export async function fetchDownloads(name: string): Promise<DownloadData> {
  const encoded = encodeURIComponent(name).replace('%40', '@')

  // Parallel fetch: last-week, last-month, last-year
  const [weekRes, monthRes, yearRes] = await Promise.all([
    $fetch<any>(`${NPM_DOWNLOADS}/point/last-week/${encoded}`).catch(() => null),
    $fetch<any>(`${NPM_DOWNLOADS}/point/last-month/${encoded}`).catch(() => null),
    $fetch<any>(`${NPM_DOWNLOADS}/point/last-year/${encoded}`).catch(() => null),
  ])

  const lastWeek = weekRes?.downloads || 0
  const lastMonth = monthRes?.downloads || 0
  const lastYear = yearRes?.downloads || 0

  // Calculate trend: compare last month's weekly average to this week
  const monthlyWeeklyAvg = lastMonth / 4.33
  let trendPercentage = 0
  let trend: 'rising' | 'stable' | 'declining' = 'stable'

  if (monthlyWeeklyAvg > 0) {
    trendPercentage = Math.round(((lastWeek - monthlyWeeklyAvg) / monthlyWeeklyAvg) * 100)
    if (trendPercentage > 10) trend = 'rising'
    else if (trendPercentage < -10) trend = 'declining'
  }

  return { lastWeek, lastMonth, lastYear, trend, trendPercentage }
}

// ──────────────────────────────────
// HELPER: Detect ESM / CJS / Dual
// ──────────────────────────────────

function detectModuleType(pkg: any): 'esm' | 'cjs' | 'dual' | 'unknown' {
  const type = pkg.type
  const hasExports = !!pkg.exports
  const hasModule = !!pkg.module
  const hasMain = !!pkg.main

  // Check for dual module (exports with both import and require)
  if (hasExports && typeof pkg.exports === 'object') {
    const exportsStr = JSON.stringify(pkg.exports)
    const hasImport = exportsStr.includes('"import"')
    const hasRequire = exportsStr.includes('"require"')
    if (hasImport && hasRequire) return 'dual'
    if (hasImport) return 'esm'
    if (hasRequire) return 'cjs'
  }

  if (type === 'module') return 'esm'
  if (type === 'commonjs') return 'cjs'
  if (hasModule && hasMain) return 'dual'
  if (hasModule) return 'esm'
  if (hasMain) return 'cjs'

  return 'unknown'
}

// ──────────────────────────────────
// HELPER: Detect TypeScript Support
// ──────────────────────────────────

function detectTypescript(pkg: any, name: string): boolean {
  // Has types/typings field
  if (pkg.types || pkg.typings) return true

  // Has exports with types condition
  if (pkg.exports) {
    const str = JSON.stringify(pkg.exports)
    if (str.includes('"types"')) return true
  }

  // Is itself a @types package
  if (name.startsWith('@types/')) return true

  // Check for .d.ts in main or types
  if (pkg.main?.endsWith('.d.ts')) return true

  return false
}

// ──────────────────────────────────
// HELPER: Parse Repository URL
// ──────────────────────────────────

function parseRepository(repo: any): RepositoryInfo | undefined {
  if (!repo) return undefined

  const url = typeof repo === 'string' ? repo : repo.url || ''
  const type = typeof repo === 'string' ? 'git' : repo.type || 'git'

  // Extract owner/repo from GitHub URL
  const ghMatch = url.match(
    /github\.com[/:]([^/]+)\/([^/.#]+)/
  )

  if (ghMatch) {
    return {
      type,
      url,
      owner: ghMatch[1],
      repo: ghMatch[2],
      provider: 'github',
    }
  }

  // GitLab
  const glMatch = url.match(/gitlab\.com[/:]([^/]+)\/([^/.#]+)/)
  if (glMatch) {
    return {
      type,
      url,
      owner: glMatch[1],
      repo: glMatch[2],
      provider: 'gitlab',
    }
  }

  return { type, url, provider: 'other' }
}
