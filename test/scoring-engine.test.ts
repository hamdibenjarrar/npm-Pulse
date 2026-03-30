// test/scoring-engine.test.ts
import { describe, it, expect } from 'vitest'
import { calculateScore } from '~/server/utils/scoring-engine'
import type { NpmPackageData, DownloadData, SecurityData, GitHubRepoData } from '~/types'

// ── Test fixtures ──

const mockNpm: NpmPackageData = {
  name: 'test-package',
  description: 'A great test package for unit testing',
  version: '2.1.0',
  license: 'MIT',
  homepage: 'https://test-package.dev',
  repository: { type: 'git', url: 'https://github.com/test/test-package', owner: 'test', repo: 'test-package', provider: 'github' },
  maintainers: [{ name: 'alice' }, { name: 'bob' }],
  keywords: ['test', 'unit', 'package'],
  dependencies: { lodash: '^4.17.0', semver: '^7.0.0' },
  devDependencies: {},
  peerDependencies: {},
  versions: [
    { version: '2.1.0', publishedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    { version: '2.0.0', publishedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
    { version: '1.0.0', publishedAt: new Date(Date.now() - 365 * 86400000).toISOString() },
  ],
  time: {
    '2.1.0': new Date(Date.now() - 30 * 86400000).toISOString(),
    '2.0.0': new Date(Date.now() - 90 * 86400000).toISOString(),
    '1.0.0': new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  distTags: { latest: '2.1.0' },
  hasTypes: true,
  moduleType: 'esm',
  unpackedSize: 50000,
  fileCount: 12,
}

const mockDownloads: DownloadData = {
  lastWeek: 500000,
  lastMonth: 2100000,
  lastYear: 25000000,
  trend: 'rising',
  trendPercentage: 15,
}

const mockSecurity: SecurityData = {
  vulnerabilities: [],
  directVulnCount: 0,
  transitiveVulnCount: 0,
  highestSeverity: 'none',
}

const mockGitHub: GitHubRepoData = {
  stars: 5000,
  forks: 300,
  openIssues: 25,
  closedIssues: 400,
  openPRs: 5,
  lastCommitAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  lastReleaseAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  license: 'MIT',
  isArchived: false,
  isFork: false,
  hasIssuesEnabled: true,
  topics: ['testing', 'utilities'],
  commitFrequency30d: 20,
  releaseFrequency90d: 3,
}

// ── Tests ──

describe('Scoring Engine', () => {
  it('produces a score between 0 and 100', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('returns correct package name and version', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    expect(result.package).toBe('test-package')
    expect(result.version).toBe('2.1.0')
  })

  it('assigns a valid grade', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade)
  })

  it('includes all four breakdown dimensions', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    expect(result.breakdown.maintenance).toBeDefined()
    expect(result.breakdown.quality).toBeDefined()
    expect(result.breakdown.security).toBeDefined()
    expect(result.breakdown.popularity).toBeDefined()
  })

  it('weights sum to 100', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    const totalWeight = result.breakdown.maintenance.weight
      + result.breakdown.quality.weight
      + result.breakdown.security.weight
      + result.breakdown.popularity.weight
    expect(totalWeight).toBe(100)
  })

  it('scores a well-maintained package highly', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    // A healthy package with types, ESM, MIT, no vulns, 500K downloads should be B+
    expect(result.score).toBeGreaterThanOrEqual(65)
    expect(result.grade).not.toBe('F')
  })

  it('generates positive signals for TypeScript types', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    const hasTypesSignal = result.signals.find(s => s.code === 'HAS_TYPES')
    expect(hasTypesSignal).toBeDefined()
    expect(hasTypesSignal?.type).toBe('positive')
  })

  it('generates clean security signal when no vulns', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    const cleanSignal = result.signals.find(s => s.code === 'CLEAN_SECURITY')
    expect(cleanSignal).toBeDefined()
  })

  it('penalizes deprecated packages', () => {
    const deprecated = { ...mockNpm, deprecated: 'Use better-package instead' }
    const normalScore = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    const deprecatedScore = calculateScore(deprecated, mockDownloads, mockSecurity, mockGitHub)
    expect(deprecatedScore.score).toBeLessThan(normalScore.score)
  })

  it('penalizes packages with vulnerabilities', () => {
    const vulnSecurity: SecurityData = {
      vulnerabilities: [{ id: 'GHSA-1234', summary: 'XSS vuln', severity: 'high', publishedAt: '2026-01-01' }],
      directVulnCount: 1,
      transitiveVulnCount: 0,
      highestSeverity: 'high',
    }
    const cleanScore = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    const vulnScore = calculateScore(mockNpm, mockDownloads, vulnSecurity, mockGitHub)
    expect(vulnScore.score).toBeLessThan(cleanScore.score)
  })

  it('penalizes archived repositories', () => {
    const archivedGH = { ...mockGitHub, isArchived: true }
    const activeScore = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    const archivedScore = calculateScore(mockNpm, mockDownloads, mockSecurity, archivedGH)
    expect(archivedScore.score).toBeLessThan(activeScore.score)
  })

  it('works without GitHub data', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, null)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.meta.sources).not.toContain('github-api')
  })

  it('includes meta with analysis timestamp', () => {
    const result = calculateScore(mockNpm, mockDownloads, mockSecurity, mockGitHub)
    expect(result.meta.analyzedAt).toBeDefined()
    expect(result.meta.apiVersion).toBe('0.1.0')
  })
})
