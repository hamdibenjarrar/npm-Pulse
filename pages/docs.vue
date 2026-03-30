<!-- pages/docs.vue — npm Pulse API Documentation -->
<script setup lang="ts">
useHead({ title: 'API Docs — npm Pulse' })

const copied = ref<string | null>(null)

async function copyCode(text: string, key: string) {
  await navigator.clipboard.writeText(text)
  copied.value = key
  setTimeout(() => { copied.value = null }, 2000)
}

const endpoints = [
  {
    id: 'score',
    method: 'GET',
    path: '/api/v1/score/:package',
    description: 'Get the Pulse score for any npm package. Supports scoped packages and specific versions.',
    params: [
      { name: ':package', type: 'string', required: true, description: 'Package name. Supports react, @nuxt/kit, react@18.2.0, @nuxt/kit@3.0.0' },
    ],
    examples: [
      { label: 'Basic', url: '/api/v1/score/react' },
      { label: 'Versioned', url: '/api/v1/score/react@18.2.0' },
      { label: 'Scoped', url: '/api/v1/score/@nuxt/kit' },
    ],    response: `{
  "package": "react",
  "version": "19.1.0",
  "score": 87,
  "grade": "B",
  "breakdown": {
    "maintenance": { "score": 82, "weight": 30, "factors": [...] },
    "quality":     { "score": 91, "weight": 25, "factors": [...] },
    "security":    { "score": 95, "weight": 25, "factors": [...] },
    "popularity":  { "score": 78, "weight": 20, "factors": [...] }
  },
  "signals": [
    { "type": "positive", "code": "HAS_TYPES",      "message": "TypeScript types included" },
    { "type": "positive", "code": "CLEAN_SECURITY", "message": "No known vulnerabilities" },
    { "type": "positive", "code": "WIDELY_ADOPTED", "message": "22.4M weekly downloads" }
  ],
  "meta": {
    "analyzedAt": "2026-03-29T14:22:00.000Z",
    "dataAge": 0,
    "sources": ["npm-registry", "npm-downloads", "osv-dev", "github-api"],
    "cacheHit": false,
    "apiVersion": "0.1.0"
  }
}`,
  },  {
    id: 'batch',
    method: 'POST',
    path: '/api/v1/batch',
    description: 'Analyze up to 50 packages in a single request. Ideal for auditing a package.json file.',
    params: [],
    examples: [],
    response: `// Request body:
{
  "packages": [
    { "package": "react" },
    { "package": "vue" },
    { "package": "svelte" }
  ]
}

// Response:
{
  "results": [ ...PulseScore, ...PulseScore, ...PulseScore ],
  "total": 3,
  "analyzedAt": "2026-03-29T14:22:00.000Z"
}`,
  },
  {
    id: 'compare',
    method: 'GET',
    path: '/api/v1/compare',
    description: 'Side-by-side comparison of 2–5 packages with a data-driven recommendation.',
    params: [
      { name: 'packages', type: 'string', required: true, description: 'Comma-separated list of 2–5 package names. E.g. react,vue,svelte' },
    ],
    examples: [
      { label: 'Compare 3 frameworks', url: '/api/v1/compare?packages=react,vue,svelte' },
    ],
    response: `{
  "packages": [ ...PulseScore, ...PulseScore, ...PulseScore ],
  "recommendation": "react leads with a Pulse score of 87/100. Strongest in security (95).",
  "comparedAt": "2026-03-29T14:22:00.000Z"
}`,
  },
]
const methodColors: Record<string, string> = {
  GET: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  POST: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
}

const scoringDims = [
  {
    name: 'Maintenance',
    weight: 30,
    color: 'text-emerald-400',
    factors: 'Publish recency, release frequency, maintainer count, commit activity, archived status',
  },
  {
    name: 'Quality',
    weight: 25,
    color: 'text-blue-400',
    factors: 'TypeScript types, module format (ESM/CJS), license presence, description quality, repository link, dependency count, deprecation flag, keywords',
  },
  {
    name: 'Security',
    weight: 25,
    color: 'text-red-400',
    factors: 'Known CVEs via OSV.dev, vulnerability severity (critical/high/medium/low), bus factor risk, dependency attack surface',
  },
  {
    name: 'Popularity',
    weight: 20,
    color: 'text-amber-400',
    factors: 'Weekly downloads (log scale), download trend (rising/stable/declining), GitHub stars',
  },
]
</script><template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 antialiased">

    <!-- AMBIENT BG -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-60 -left-60 w-[600px] h-[600px] rounded-full opacity-30"
        style="background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)" />
    </div>

    <!-- NAV -->
    <nav class="relative z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md sticky top-0">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
        <a href="/" class="text-zinc-500 hover:text-zinc-200 transition-colors duration-150 text-sm flex items-center gap-1.5">
          <span>←</span> Back
        </a>
        <span class="text-zinc-700">|</span>
        <span class="font-semibold text-sm">API Documentation</span>
        <span class="ml-auto text-xs text-zinc-700 font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">v0.1.0</span>
      </div>
    </nav>

    <div class="relative z-10 max-w-5xl mx-auto px-6 py-14">
      <!-- PAGE HEADER -->
      <div class="mb-14">
        <h1 class="text-3xl font-bold mb-3">npm Pulse API</h1>
        <div class="flex flex-wrap items-center gap-4 mb-4">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-zinc-500">Base URL</span>
            <code class="text-emerald-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 font-mono text-xs">
              https://npm-pulse-hamdibenjarrars-projects.vercel.app
            </code>
          </div>
        </div>
        <p class="text-zinc-500 text-sm max-w-xl">
          REST API with JSON responses. No API key required for the free tier (100 requests/day, rate-limited by IP).
          Paid plans include higher limits and additional features.
        </p>
      </div>

      <!-- TABLE OF CONTENTS -->
      <nav class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-12">
        <p class="text-xs text-zinc-600 uppercase tracking-widest mb-3 font-medium">On this page</p>
        <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
          <a href="#auth" class="hover:text-emerald-400 transition-colors">Authentication</a>
          <a href="#score" class="hover:text-emerald-400 transition-colors">GET /score/:package</a>
          <a href="#batch" class="hover:text-emerald-400 transition-colors">POST /batch</a>
          <a href="#compare" class="hover:text-emerald-400 transition-colors">GET /compare</a>
          <a href="#scoring" class="hover:text-emerald-400 transition-colors">Scoring Methodology</a>
          <a href="#limits" class="hover:text-emerald-400 transition-colors">Rate Limits</a>
        </div>
      </nav>
      <!-- AUTHENTICATION -->
      <section id="auth" class="mb-14">
        <h2 class="text-xl font-semibold mb-4">Authentication</h2>
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-zinc-800">
            <p class="text-sm text-zinc-400">
              Free tier requires no authentication — just send requests. For Pro/Team/Enterprise tiers,
              include your API key as a Bearer token:
            </p>
          </div>
          <div class="px-5 py-4 relative">
            <button
              class="absolute right-4 top-4 text-xs px-2.5 py-1 rounded transition-all duration-150"
              :class="copied === 'auth' ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'"
              @click="copyCode('Authorization: Bearer pk_live_your_api_key_here', 'auth')"
            >{{ copied === 'auth' ? '✔ Copied' : '⎘ Copy' }}</button>
            <code class="text-xs text-zinc-300 font-mono">Authorization: Bearer pk_live_your_api_key_here</code>
          </div>
        </div>
      </section>
      <!-- ENDPOINTS -->
      <section v-for="ep in endpoints" :key="ep.id" :id="ep.id" class="mb-14">
        <div class="flex items-center gap-3 mb-4">
          <span
            class="px-2.5 py-1 rounded-md text-xs font-bold font-mono border"
            :class="methodColors[ep.method]"
          >{{ ep.method }}</span>
          <code class="text-sm text-zinc-200 font-mono">{{ ep.path }}</code>
        </div>

        <p class="text-zinc-400 text-sm mb-5 leading-relaxed">{{ ep.description }}</p>

        <!-- Parameters -->
        <div v-if="ep.params.length" class="mb-5">
          <p class="text-xs text-zinc-600 uppercase tracking-widest mb-3 font-medium">Parameters</p>
          <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
            <div v-for="param in ep.params" :key="param.name" class="px-5 py-3 flex items-start gap-4">
              <code class="text-xs font-mono text-emerald-400 mt-0.5 flex-shrink-0 w-28">{{ param.name }}</code>
              <div>
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-xs text-zinc-500 font-mono">{{ param.type }}</span>
                  <span v-if="param.required" class="text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded font-mono">required</span>
                </div>
                <p class="text-xs text-zinc-500">{{ param.description }}</p>
              </div>
            </div>
          </div>
        </div>
        <!-- Try it links -->
        <div v-if="ep.examples.length" class="mb-5">
          <p class="text-xs text-zinc-600 uppercase tracking-widest mb-3 font-medium">Try it</p>
          <div class="flex flex-wrap gap-2">
            <a
              v-for="ex in ep.examples" :key="ex.url"
              :href="ex.url" target="_blank"
              class="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700
                     text-zinc-400 px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-2 font-mono"
            >
              {{ ex.label }}: <span class="text-emerald-400">{{ ex.url }}</span>
              <span class="text-zinc-700 text-xs">↗</span>
            </a>
          </div>
        </div>

        <!-- Response -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div class="px-5 py-2.5 bg-zinc-800/40 border-b border-zinc-800 flex items-center justify-between">
            <span class="text-xs text-zinc-500 font-mono">Response</span>
            <button
              class="text-xs px-2.5 py-1 rounded transition-all duration-150"
              :class="copied === ep.id ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-700'"
              @click="copyCode(ep.response, ep.id)"
            >{{ copied === ep.id ? '✔ Copied' : '⎘ Copy' }}</button>
          </div>
          <pre class="p-5 text-xs text-zinc-300 overflow-x-auto leading-relaxed font-mono"><code>{{ ep.response }}</code></pre>
        </div>
      </section>
      <!-- SCORING METHODOLOGY -->
      <section id="scoring" class="mb-14">
        <h2 class="text-xl font-semibold mb-2">Scoring Methodology</h2>
        <p class="text-zinc-500 text-sm mb-6 max-w-xl">
          Every score is computed from publicly available data. The algorithm is open source and auditable.
        </p>
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
          <div v-for="dim in scoringDims" :key="dim.name" class="px-6 py-5">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2.5">
                <span class="text-base font-bold" :class="dim.color">{{ dim.weight }}%</span>
                <span class="text-sm font-semibold">{{ dim.name }}</span>
              </div>
              <div class="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full" :class="dim.color.replace('text-', 'bg-')" :style="{ width: `${dim.weight * 3.33}%` }" />
              </div>
            </div>
            <p class="text-xs text-zinc-600 leading-relaxed">{{ dim.factors }}</p>
          </div>
        </div>
      </section>
      <!-- RATE LIMITS -->
      <section id="limits" class="mb-14">
        <h2 class="text-xl font-semibold mb-4">Rate Limits</h2>
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-800">
            <div v-for="tier in rateLimits" :key="tier.name" class="px-6 py-5">
              <p class="text-xs text-zinc-600 mb-1 font-medium">{{ tier.name }}</p>
              <p class="text-lg font-bold text-zinc-200">{{ tier.limit }}</p>
              <p class="text-xs text-zinc-600 mt-0.5">per day</p>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-zinc-800 bg-zinc-800/20">
            <p class="text-xs text-zinc-600 font-mono">
              Rate limit headers: <span class="text-zinc-500">X-RateLimit-Remaining</span> · <span class="text-zinc-500">X-RateLimit-Reset</span>
            </p>
          </div>
        </div>
      </section>
      <!-- ERRORS -->
      <section class="mb-14">
        <h2 class="text-xl font-semibold mb-4">Error Responses</h2>
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
          <div v-for="err in errors" :key="err.code" class="px-5 py-3.5 flex items-center gap-4">
            <span class="text-xs font-mono font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded w-12 text-center flex-shrink-0">{{ err.code }}</span>
            <div>
              <p class="text-sm font-medium text-zinc-300">{{ err.name }}</p>
              <p class="text-xs text-zinc-600">{{ err.description }}</p>
            </div>
          </div>
        </div>
      </section>

    </div>

    <!-- FOOTER -->
    <footer class="relative z-10 border-t border-zinc-800/50">
      <div class="max-w-5xl mx-auto px-6 py-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-zinc-400">npm Pulse</span>
            <span class="text-zinc-700">·</span>
            <span class="text-sm text-zinc-600">by <span class="text-zinc-500 font-semibold">MYNTHISM</span></span>
          </div>
          <div class="flex gap-5 text-sm text-zinc-600">
            <a href="/" class="hover:text-zinc-400 transition-colors">Home</a>
            <a href="/pricing" class="hover:text-zinc-400 transition-colors">Pricing</a>
            <a href="https://github.com/hamdibenjarrar/npm-Pulse" class="hover:text-zinc-400 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>

  </div>
</template>
<script lang="ts">
const rateLimits = [
  { name: 'Free', limit: '100' },
  { name: 'Pro', limit: '10,000' },
  { name: 'Team', limit: '50,000' },
  { name: 'Enterprise', limit: 'Unlimited' },
]

const errors = [
  { code: '400', name: 'Bad Request', description: 'Invalid package name or missing required parameters.' },
  { code: '404', name: 'Not Found', description: 'Package does not exist on the npm registry.' },
  { code: '429', name: 'Rate Limited', description: 'You have exceeded the rate limit for your tier. Check X-RateLimit-Reset.' },
  { code: '500', name: 'Server Error', description: 'An upstream API failed. The response may include a stale cached result.' },
]
</script>