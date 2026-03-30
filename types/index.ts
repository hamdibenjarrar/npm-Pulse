// types/index.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// npm Pulse — Core Type System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ──────────────────────────────────
// SCORE OUTPUT
// ──────────────────────────────────

export interface PulseScore {
  package: string
  version: string
  score: number                // 0-100 overall score
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: ScoreBreakdown
  signals: Signal[]
  meta: ScoreMeta
}

export interface ScoreBreakdown {
  maintenance: DimensionScore  // 30% weight
  quality: DimensionScore      // 25% weight
  security: DimensionScore     // 25% weight
  popularity: DimensionScore   // 20% weight
}

export interface DimensionScore {
  score: number                // 0-100
  weight: number               // percentage weight in overall
  factors: Factor[]
}

export interface Factor {
  name: string
  value: number                // raw value
  normalized: number           // 0-1 normalized
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

export interface Signal {
  type: 'warning' | 'info' | 'positive' | 'critical'
  code: string
  message: string
  details?: string
}

export interface ScoreMeta {
  analyzedAt: string           // ISO timestamp
  dataAge: number              // seconds since last data refresh
  sources: string[]            // which APIs were queried
  cacheHit: boolean
  apiVersion: string
}

// ──────────────────────────────────
// npm REGISTRY DATA
// ──────────────────────────────────

export interface NpmPackageData {
  name: string
  description?: string
  version: string              // latest version
  license?: string
  homepage?: string
  repository?: RepositoryInfo
  maintainers: NpmMaintainer[]
  keywords?: string[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>

  // Computed from registry
  versions: VersionInfo[]
  time: Record<string, string> // version → publish date
  distTags: Record<string, string>
  deprecated?: string

  // From dist object
  unpackedSize?: number
  fileCount?: number
  hasTypes: boolean
  moduleType: 'esm' | 'cjs' | 'dual' | 'unknown'
}

export interface RepositoryInfo {
  type: string
  url: string
  owner?: string
  repo?: string
  provider?: 'github' | 'gitlab' | 'bitbucket' | 'other'
}

export interface NpmMaintainer {
  name: string
  email?: string
}

export interface VersionInfo {
  version: string
  publishedAt: string
  deprecated?: string
  unpackedSize?: number
}

// ──────────────────────────────────
// GITHUB DATA (optional enrichment)
// ──────────────────────────────────

export interface GitHubRepoData {
  stars: number
  forks: number
  openIssues: number
  closedIssues: number
  openPRs: number
  lastCommitAt: string
  lastReleaseAt?: string
  license?: string
  isArchived: boolean
  isFork: boolean
  hasIssuesEnabled: boolean
  topics: string[]
  contributorCount?: number

  // Computed
  issueResponseTimeDays?: number
  commitFrequency30d?: number
  releaseFrequency90d?: number
}

// ──────────────────────────────────
// SECURITY DATA (OSV)
// ──────────────────────────────────

export interface SecurityData {
  vulnerabilities: Vulnerability[]
  directVulnCount: number
  transitiveVulnCount: number
  highestSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

export interface Vulnerability {
  id: string
  summary: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  fixedIn?: string
  publishedAt: string
}

// ──────────────────────────────────
// DOWNLOAD DATA
// ──────────────────────────────────

export interface DownloadData {
  lastWeek: number
  lastMonth: number
  lastYear: number
  trend: 'rising' | 'stable' | 'declining'
  trendPercentage: number      // month-over-month change %
}

// ──────────────────────────────────
// API REQUEST/RESPONSE
// ──────────────────────────────────

export interface ScoreRequest {
  package: string
  version?: string             // defaults to latest
}

export interface BatchRequest {
  packages: ScoreRequest[]     // max 50
}

export interface CompareRequest {
  packages: string[]           // 2-5 package names
}

export interface CompareResponse {
  packages: PulseScore[]
  recommendation?: string
  comparedAt: string
}

export interface ApiError {
  error: string
  code: string
  status: number
  details?: string
}

// ──────────────────────────────────
// SUPABASE CACHE SCHEMA
// ──────────────────────────────────

export interface CachedScore {
  id: string
  package_name: string
  version: string
  score_data: PulseScore       // JSONB
  npm_data: NpmPackageData     // JSONB
  github_data?: GitHubRepoData // JSONB
  security_data?: SecurityData // JSONB
  download_data?: DownloadData // JSONB
  created_at: string
  updated_at: string
  expires_at: string
}

// ──────────────────────────────────
// API KEY & BILLING (future)
// ──────────────────────────────────

export interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  tier: 'free' | 'pro' | 'team' | 'enterprise'
  daily_limit: number
  daily_used: number
  created_at: string
  last_used_at: string
  is_active: boolean
}
