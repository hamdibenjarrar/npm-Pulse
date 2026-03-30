// server/utils/security.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OSV.dev Security Client — Vulnerability data
// Free API, no auth, no rate limits
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { SecurityData, Vulnerability } from '~/types'

const OSV_API = 'https://api.osv.dev/v1'

export async function fetchSecurityData(
  packageName: string,
  version: string
): Promise<SecurityData> {
  try {
    const res = await $fetch<any>(`${OSV_API}/query`, {
      method: 'POST',
      body: {
        version,
        package: {
          name: packageName,
          ecosystem: 'npm',
        },
      },
      timeout: 10000,
    })

    const vulns: Vulnerability[] = (res.vulns || []).map((v: any) => {
      // Extract severity from CVSS or database_specific
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
      const cvss = v.severity?.[0]?.score
      if (cvss) {
        if (cvss >= 9.0) severity = 'critical'
        else if (cvss >= 7.0) severity = 'high'
        else if (cvss >= 4.0) severity = 'medium'
        else severity = 'low'
      }
      else if (v.database_specific?.severity) {
        severity = v.database_specific.severity.toLowerCase()
      }

      // Find fixed version
      let fixedIn: string | undefined
      for (const affected of v.affected || []) {
        for (const range of affected.ranges || []) {
          for (const event of range.events || []) {
            if (event.fixed) fixedIn = event.fixed
          }
        }
      }

      return {
        id: v.id,
        summary: v.summary || 'No description available',
        severity,
        fixedIn,
        publishedAt: v.published || '',
      }
    })

    // Determine highest severity
    const severityOrder = ['critical', 'high', 'medium', 'low', 'none'] as const
    let highestSeverity: SecurityData['highestSeverity'] = 'none'
    for (const s of severityOrder) {
      if (s === 'none') break
      if (vulns.some(v => v.severity === s)) {
        highestSeverity = s
        break
      }
    }

    return {
      vulnerabilities: vulns,
      directVulnCount: vulns.length,
      transitiveVulnCount: 0, // Would require dep tree resolution
      highestSeverity,
    }
  }
  catch (error: any) {
    console.warn(`OSV fetch failed for ${packageName}@${version}: ${error.message}`)
    return {
      vulnerabilities: [],
      directVulnCount: 0,
      transitiveVulnCount: 0,
      highestSeverity: 'none',
    }
  }
}

// Batch query for multiple packages (efficient)
export async function fetchSecurityBatch(
  packages: { name: string, version: string }[]
): Promise<Map<string, SecurityData>> {
  const results = new Map<string, SecurityData>()

  try {
    const res = await $fetch<any>(`${OSV_API}/querybatch`, {
      method: 'POST',
      body: {
        queries: packages.map(p => ({
          version: p.version,
          package: { name: p.name, ecosystem: 'npm' },
        })),
      },
      timeout: 20000,
    })

    const batchResults = res.results || []
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i]
      const vulnResult = batchResults[i]
      const vulns = (vulnResult?.vulns || []).length

      results.set(`${pkg.name}@${pkg.version}`, {
        vulnerabilities: (vulnResult?.vulns || []).map((v: any) => ({
          id: v.id,
          summary: v.summary || '',
          severity: 'medium' as const,
          publishedAt: v.published || '',
        })),
        directVulnCount: vulns,
        transitiveVulnCount: 0,
        highestSeverity: vulns > 0 ? 'medium' : 'none',
      })
    }
  }
  catch {
    // Fallback: mark all as unknown
    for (const pkg of packages) {
      results.set(`${pkg.name}@${pkg.version}`, {
        vulnerabilities: [],
        directVulnCount: 0,
        transitiveVulnCount: 0,
        highestSeverity: 'none',
      })
    }
  }

  return results
}
