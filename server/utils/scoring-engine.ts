// server/utils/scoring-engine.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// npm Pulse — Transparent Scoring Engine v0.1
//
// PHILOSOPHY: Every factor is documented. Every weight
// is explained. Anyone can audit why a package got its
// score. This is our moat — npms.io scores are opaque.
//
// WEIGHTS:
//   Maintenance  30%  — Is someone home?
//   Quality      25%  — Is the code well-built?
//   Security     25%  — Is it safe to use?
//   Popularity   20%  — Does the community trust it?
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type {
  PulseScore,
  ScoreBreakdown,
  DimensionScore,
  Factor,
  Signal,
  NpmPackageData,
  GitHubRepoData,
  SecurityData,
  DownloadData,
} from '~/types'

// ──────────────────────────────────
// MAIN SCORING FUNCTION
// ──────────────────────────────────

export function calculateScore(
  npm: NpmPackageData,
  downloads: DownloadData,
  security: SecurityData,
  github: GitHubRepoData | null,
): PulseScore {
  const maintenance = scoreMaintenance(npm, github)
  const quality = scoreQuality(npm)
  const securityScore = scoreSecurity(security, npm)
  const popularity = scorePopularity(downloads, github)

  // Weighted composite
  const overall = Math.round(
    maintenance.score * 0.30
    + quality.score * 0.25
    + securityScore.score * 0.25
    + popularity.score * 0.20,
  )

  // Generate signals (warnings, positives, etc.)
  const signals = generateSignals(npm, downloads, security, github)

  // Letter grade
  const grade = overall >= 90 ? 'A'
    : overall >= 75 ? 'B'
      : overall >= 60 ? 'C'
        : overall >= 40 ? 'D'
          : 'F'

  return {
    package: npm.name,
    version: npm.version,
    score: overall,
    grade,
    breakdown: {
      maintenance: { ...maintenance, weight: 30 },
      quality: { ...quality, weight: 25 },
      security: { ...securityScore, weight: 25 },
      popularity: { ...popularity, weight: 20 },
    },
    signals,
    meta: {
      analyzedAt: new Date().toISOString(),
      dataAge: 0,
      sources: [
        'npm-registry',
        'npm-downloads',
        'osv-dev',
        ...(github ? ['github-api'] : []),
      ],
      cacheHit: false,
      apiVersion: '0.1.0',
    },
  }
}

// ──────────────────────────────────
// MAINTENANCE SCORE (30%)
// ──────────────────────────────────
// Key question: Is someone actively maintaining this?

function scoreMaintenance(
  npm: NpmPackageData,
  github: GitHubRepoData | null,
): DimensionScore {
  const factors: Factor[] = []

  // Factor 1: Days since last publish (max 100)
  const lastPublish = npm.time[npm.version]
  const daysSincePublish = lastPublish
    ? Math.floor((Date.now() - new Date(lastPublish).getTime()) / (1000 * 60 * 60 * 24))
    : 999
  const publishRecency = normalize(daysSincePublish, 0, 365, true) // inverse: fewer days = better
  factors.push({
    name: 'publish_recency',
    value: daysSincePublish,
    normalized: publishRecency,
    description: `Last published ${daysSincePublish} days ago`,
    impact: publishRecency > 0.5 ? 'positive' : 'negative',
  })

  // Factor 2: Release frequency (versions in last 12 months)
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const recentVersions = npm.versions.filter(
    v => new Date(v.publishedAt) > oneYearAgo,
  ).length
  const releaseFreq = normalize(recentVersions, 0, 24, false) // more = better, cap at 24
  factors.push({
    name: 'release_frequency',
    value: recentVersions,
    normalized: releaseFreq,
    description: `${recentVersions} versions published in the last year`,
    impact: releaseFreq > 0.3 ? 'positive' : 'negative',
  })

  // Factor 3: Maintainer count
  const maintainerCount = npm.maintainers.length
  const maintainerScore = normalize(maintainerCount, 0, 5, false) // 5+ is ideal
  factors.push({
    name: 'maintainer_count',
    value: maintainerCount,
    normalized: maintainerScore,
    description: `${maintainerCount} maintainer(s)`,
    impact: maintainerCount >= 2 ? 'positive' : maintainerCount === 1 ? 'neutral' : 'negative',
  })

  // Factor 4: GitHub commit activity (if available)
  if (github) {
    const commitFreq = normalize(github.commitFrequency30d || 0, 0, 30, false)
    factors.push({
      name: 'commit_frequency',
      value: github.commitFrequency30d || 0,
      normalized: commitFreq,
      description: `${github.commitFrequency30d || 0} commits in the last 30 days`,
      impact: commitFreq > 0.3 ? 'positive' : 'neutral',
    })
  }

  // Factor 5: Is archived?
  if (github?.isArchived) {
    factors.push({
      name: 'archived',
      value: 1,
      normalized: 0,
      description: 'Repository is archived',
      impact: 'negative',
    })
  }

  const score = Math.round(
    averageNormalized(factors) * 100,
  )

  return { score: Math.min(100, Math.max(0, score)), weight: 30, factors }
}

// ──────────────────────────────────
// QUALITY SCORE (25%)
// ──────────────────────────────────
// Key question: Is this well-built software?

function scoreQuality(npm: NpmPackageData): DimensionScore {
  const factors: Factor[] = []

  // Factor 1: Has TypeScript types
  factors.push({
    name: 'typescript_types',
    value: npm.hasTypes ? 1 : 0,
    normalized: npm.hasTypes ? 1.0 : 0.0,
    description: npm.hasTypes ? 'TypeScript types included' : 'No TypeScript types',
    impact: npm.hasTypes ? 'positive' : 'neutral',
  })

  // Factor 2: Module format (ESM > dual > CJS > unknown)
  const moduleScores = { esm: 1.0, dual: 1.0, cjs: 0.5, unknown: 0.2 }
  const moduleNorm = moduleScores[npm.moduleType]
  factors.push({
    name: 'module_format',
    value: moduleNorm,
    normalized: moduleNorm,
    description: `Module format: ${npm.moduleType.toUpperCase()}`,
    impact: moduleNorm >= 0.8 ? 'positive' : 'neutral',
  })

  // Factor 3: Has license
  const hasLicense = !!npm.license && npm.license !== 'UNLICENSED'
  factors.push({
    name: 'license',
    value: hasLicense ? 1 : 0,
    normalized: hasLicense ? 1.0 : 0.0,
    description: hasLicense ? `License: ${npm.license}` : 'No license specified',
    impact: hasLicense ? 'positive' : 'negative',
  })

  // Factor 4: Has description
  const hasDesc = !!npm.description && npm.description.length > 10
  factors.push({
    name: 'description',
    value: hasDesc ? 1 : 0,
    normalized: hasDesc ? 1.0 : 0.0,
    description: hasDesc ? 'Package has description' : 'Missing description',
    impact: hasDesc ? 'positive' : 'negative',
  })

  // Factor 5: Has repository link
  const hasRepo = !!npm.repository?.url
  factors.push({
    name: 'repository',
    value: hasRepo ? 1 : 0,
    normalized: hasRepo ? 1.0 : 0.0,
    description: hasRepo ? 'Repository linked' : 'No repository link',
    impact: hasRepo ? 'positive' : 'negative',
  })

  // Factor 6: Has homepage
  const hasHome = !!npm.homepage
  factors.push({
    name: 'homepage',
    value: hasHome ? 1 : 0,
    normalized: hasHome ? 0.8 : 0.0,
    description: hasHome ? 'Homepage available' : 'No homepage',
    impact: hasHome ? 'positive' : 'neutral',
  })

  // Factor 7: Dependency count (fewer = better, up to a point)
  const depCount = Object.keys(npm.dependencies || {}).length
  const depScore = normalize(depCount, 0, 30, true) // inverse: fewer deps = better
  factors.push({
    name: 'dependency_count',
    value: depCount,
    normalized: depScore,
    description: `${depCount} runtime dependencies`,
    impact: depCount <= 5 ? 'positive' : depCount > 20 ? 'negative' : 'neutral',
  })

  // Factor 8: Not deprecated
  const isDeprecated = !!npm.deprecated
  factors.push({
    name: 'not_deprecated',
    value: isDeprecated ? 0 : 1,
    normalized: isDeprecated ? 0.0 : 1.0,
    description: isDeprecated ? `DEPRECATED: ${npm.deprecated}` : 'Not deprecated',
    impact: isDeprecated ? 'negative' : 'positive',
  })

  // Factor 9: Has keywords
  const hasKeywords = (npm.keywords?.length || 0) > 0
  factors.push({
    name: 'keywords',
    value: npm.keywords?.length || 0,
    normalized: hasKeywords ? 0.7 : 0.0,
    description: `${npm.keywords?.length || 0} keywords`,
    impact: hasKeywords ? 'positive' : 'neutral',
  })

  const score = Math.round(averageNormalized(factors) * 100)
  return { score: Math.min(100, Math.max(0, score)), weight: 25, factors }
}

// ──────────────────────────────────
// SECURITY SCORE (25%)
// ──────────────────────────────────
// Key question: Is it safe to use?

function scoreSecurity(
  security: SecurityData,
  npm: NpmPackageData,
): DimensionScore {
  const factors: Factor[] = []

  // Factor 1: Known vulnerabilities (most important)
  const vulnCount = security.directVulnCount
  const vulnScore = vulnCount === 0 ? 1.0 : vulnCount <= 2 ? 0.4 : 0.0
  factors.push({
    name: 'known_vulnerabilities',
    value: vulnCount,
    normalized: vulnScore,
    description: vulnCount === 0
      ? 'No known vulnerabilities'
      : `${vulnCount} known vulnerabilities`,
    impact: vulnCount === 0 ? 'positive' : 'negative',
  })

  // Factor 2: Highest severity
  const severityScores = { none: 1.0, low: 0.7, medium: 0.4, high: 0.15, critical: 0.0 }
  const sevScore = severityScores[security.highestSeverity]
  factors.push({
    name: 'severity_level',
    value: sevScore,
    normalized: sevScore,
    description: `Highest severity: ${security.highestSeverity}`,
    impact: security.highestSeverity === 'none' ? 'positive' : 'negative',
  })

  // Factor 3: Dependency chain depth (more deps = more attack surface)
  const totalDeps = Object.keys(npm.dependencies || {}).length
  const depRisk = normalize(totalDeps, 0, 20, true)
  factors.push({
    name: 'dependency_surface',
    value: totalDeps,
    normalized: depRisk,
    description: `${totalDeps} direct dependencies (attack surface)`,
    impact: totalDeps <= 3 ? 'positive' : totalDeps > 15 ? 'negative' : 'neutral',
  })

  // Factor 4: Has provenance / multiple maintainers (bus factor)
  const busFactor = npm.maintainers.length >= 2 ? 0.8 : npm.maintainers.length === 1 ? 0.4 : 0.0
  factors.push({
    name: 'bus_factor',
    value: npm.maintainers.length,
    normalized: busFactor,
    description: `Bus factor: ${npm.maintainers.length} maintainer(s)`,
    impact: npm.maintainers.length >= 2 ? 'positive' : 'neutral',
  })

  const score = Math.round(averageNormalized(factors) * 100)
  return { score: Math.min(100, Math.max(0, score)), weight: 25, factors }
}

// ──────────────────────────────────
// POPULARITY SCORE (20%)
// ──────────────────────────────────
// Key question: Does the community trust this?

function scorePopularity(
  downloads: DownloadData,
  github: GitHubRepoData | null,
): DimensionScore {
  const factors: Factor[] = []

  // Factor 1: Weekly downloads (log scale)
  // 0 = 0, 100 = 1, 10K = 0.5, 1M = 0.75, 10M+ = 1.0
  const dlScore = downloads.lastWeek <= 0
    ? 0
    : Math.min(1, Math.log10(downloads.lastWeek) / 7) // log10(10M) = 7
  factors.push({
    name: 'weekly_downloads',
    value: downloads.lastWeek,
    normalized: dlScore,
    description: `${formatNumber(downloads.lastWeek)} weekly downloads`,
    impact: dlScore > 0.5 ? 'positive' : 'neutral',
  })

  // Factor 2: Download trend
  const trendScores = { rising: 0.9, stable: 0.6, declining: 0.3 }
  factors.push({
    name: 'download_trend',
    value: downloads.trendPercentage,
    normalized: trendScores[downloads.trend],
    description: `Trend: ${downloads.trend} (${downloads.trendPercentage > 0 ? '+' : ''}${downloads.trendPercentage}%)`,
    impact: downloads.trend === 'rising' ? 'positive' : downloads.trend === 'declining' ? 'negative' : 'neutral',
  })

  // Factor 3: GitHub stars (if available)
  if (github) {
    const starScore = github.stars <= 0
      ? 0
      : Math.min(1, Math.log10(github.stars) / 5) // log10(100K) = 5
    factors.push({
      name: 'github_stars',
      value: github.stars,
      normalized: starScore,
      description: `${formatNumber(github.stars)} GitHub stars`,
      impact: starScore > 0.5 ? 'positive' : 'neutral',
    })
  }

  const score = Math.round(averageNormalized(factors) * 100)
  return { score: Math.min(100, Math.max(0, score)), weight: 20, factors }
}

// ──────────────────────────────────
// SIGNAL GENERATION
// ──────────────────────────────────

function generateSignals(
  npm: NpmPackageData,
  downloads: DownloadData,
  security: SecurityData,
  github: GitHubRepoData | null,
): Signal[] {
  const signals: Signal[] = []

  // Critical signals
  if (npm.deprecated) {
    signals.push({
      type: 'critical',
      code: 'DEPRECATED',
      message: 'This package is deprecated',
      details: npm.deprecated,
    })
  }

  if (security.highestSeverity === 'critical') {
    signals.push({
      type: 'critical',
      code: 'CRITICAL_VULN',
      message: 'Critical vulnerability detected',
      details: security.vulnerabilities.find(v => v.severity === 'critical')?.summary,
    })
  }

  if (github?.isArchived) {
    signals.push({
      type: 'critical',
      code: 'ARCHIVED',
      message: 'Repository is archived — no longer maintained',
    })
  }

  // Warning signals
  const daysSincePublish = npm.time[npm.version]
    ? Math.floor((Date.now() - new Date(npm.time[npm.version]).getTime()) / (1000 * 60 * 60 * 24))
    : 999
  if (daysSincePublish > 365) {
    signals.push({
      type: 'warning',
      code: 'STALE',
      message: `No new version in ${Math.floor(daysSincePublish / 30)} months`,
    })
  }

  if (npm.maintainers.length === 1) {
    signals.push({
      type: 'warning',
      code: 'SINGLE_MAINTAINER',
      message: 'Single maintainer — potential bus factor risk',
    })
  }

  if (security.directVulnCount > 0 && security.highestSeverity !== 'critical') {
    signals.push({
      type: 'warning',
      code: 'HAS_VULNS',
      message: `${security.directVulnCount} known vulnerability(ies)`,
    })
  }

  if (downloads.trend === 'declining' && downloads.trendPercentage < -25) {
    signals.push({
      type: 'warning',
      code: 'DECLINING',
      message: `Downloads declining ${Math.abs(downloads.trendPercentage)}% month-over-month`,
    })
  }

  const depCount = Object.keys(npm.dependencies || {}).length
  if (depCount > 20) {
    signals.push({
      type: 'warning',
      code: 'HEAVY_DEPS',
      message: `${depCount} runtime dependencies — large attack surface`,
    })
  }

  // Positive signals
  if (npm.hasTypes) {
    signals.push({
      type: 'positive',
      code: 'HAS_TYPES',
      message: 'TypeScript types included',
    })
  }

  if (npm.moduleType === 'esm' || npm.moduleType === 'dual') {
    signals.push({
      type: 'positive',
      code: 'MODERN_MODULE',
      message: `Ships as ${npm.moduleType.toUpperCase()}`,
    })
  }

  if (security.directVulnCount === 0) {
    signals.push({
      type: 'positive',
      code: 'CLEAN_SECURITY',
      message: 'No known vulnerabilities',
    })
  }

  if (downloads.lastWeek > 1_000_000) {
    signals.push({
      type: 'positive',
      code: 'WIDELY_ADOPTED',
      message: `${formatNumber(downloads.lastWeek)} weekly downloads`,
    })
  }

  return signals
}

// ──────────────────────────────────
// UTILITY FUNCTIONS
// ──────────────────────────────────

/**
 * Normalize a value to 0-1 range
 * @param value — raw value
 * @param min — minimum expected
 * @param max — maximum expected
 * @param inverse — if true, lower values score higher
 */
function normalize(value: number, min: number, max: number, inverse: boolean): number {
  const clamped = Math.max(min, Math.min(max, value))
  const norm = (clamped - min) / (max - min)
  return inverse ? 1 - norm : norm
}

/** Average all normalized factor values */
function averageNormalized(factors: Factor[]): number {
  if (factors.length === 0) return 0
  const sum = factors.reduce((acc, f) => acc + f.normalized, 0)
  return sum / factors.length
}

/** Format large numbers: 1234567 → "1.2M" */
function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
