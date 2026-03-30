// server/utils/github.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GitHub API Client — Repository enrichment data
// Uses public API (60 req/hr) or token (5000 req/hr)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { GitHubRepoData } from '~/types'

const GITHUB_API = 'https://api.github.com'

export async function fetchGitHubData(
  owner: string,
  repo: string
): Promise<GitHubRepoData | null> {
  const config = useRuntimeConfig()
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'npm-pulse/0.1',
  }

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`
  }

  try {
    // Parallel fetch: repo info + recent commits + issues
    const [repoData, commitsData, releasesData] = await Promise.all([
      $fetch<any>(`${GITHUB_API}/repos/${owner}/${repo}`, { headers, timeout: 10000 }),
      $fetch<any[]>(`${GITHUB_API}/repos/${owner}/${repo}/commits`, {
        headers,
        timeout: 10000,
        params: { per_page: 30 },
      }).catch(() => []),
      $fetch<any[]>(`${GITHUB_API}/repos/${owner}/${repo}/releases`, {
        headers,
        timeout: 10000,
        params: { per_page: 10 },
      }).catch(() => []),
    ])

    // Commit frequency (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentCommits = (commitsData || []).filter((c: any) => {
      const date = new Date(c.commit?.author?.date || 0)
      return date > thirtyDaysAgo
    })

    // Release frequency (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const recentReleases = (releasesData || []).filter((r: any) => {
      const date = new Date(r.published_at || 0)
      return date > ninetyDaysAgo
    })

    // Last release date
    const lastRelease = releasesData?.[0]?.published_at

    return {
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      openIssues: repoData.open_issues_count || 0,
      closedIssues: 0, // Would need search API for this
      openPRs: 0,
      lastCommitAt: repoData.pushed_at || '',
      lastReleaseAt: lastRelease || undefined,
      license: repoData.license?.spdx_id || undefined,
      isArchived: repoData.archived || false,
      isFork: repoData.fork || false,
      hasIssuesEnabled: repoData.has_issues || false,
      topics: repoData.topics || [],
      commitFrequency30d: recentCommits.length,
      releaseFrequency90d: recentReleases.length,
    }
  }
  catch (error: any) {
    // Rate limited or repo not found — degrade gracefully
    console.warn(`GitHub fetch failed for ${owner}/${repo}: ${error.message}`)
    return null
  }
}
