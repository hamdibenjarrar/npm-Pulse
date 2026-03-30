<!-- pages/index.vue — npm Pulse Enhanced Landing Page -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PulseScore } from '~/types'

useHead({
  title: 'npm Pulse — Package Intelligence API',
  meta: [
    { name: 'description', content: 'Transparent health scores, security analysis, and maintenance insights for every npm package.' },
  ],
})

const searchQuery = ref('')
const isLoading = ref(false)
const scoreResult = ref<PulseScore | null>(null)
const error = ref('')
const copied = ref(false)

async function analyzePackage() {
  const pkg = searchQuery.value.trim()
  if (!pkg) return
  isLoading.value = true
  error.value = ''
  scoreResult.value = null
  try {
    const data = await $fetch<PulseScore>(`/api/v1/score/${encodeURIComponent(pkg)}`)
    scoreResult.value = data
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Package not found'
  } finally {
    isLoading.value = false
  }
}
function quickSearch(pkg: string) {
  searchQuery.value = pkg
  analyzePackage()
}

async function copyEndpoint() {
  if (!scoreResult.value) return
  await navigator.clipboard.writeText(`curl https://npm-pulse.vercel.app/api/v1/score/${scoreResult.value.package}`)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const gradeConfig = computed(() => {
  if (!scoreResult.value) return { color: '', ring: '', bg: '', stroke: '#71717a' }
  const configs: Record<string, any> = {
    A: { color: 'text-emerald-400', ring: 'ring-emerald-400/40', bg: 'bg-emerald-400/10', stroke: '#34d399' },
    B: { color: 'text-blue-400', ring: 'ring-blue-400/40', bg: 'bg-blue-400/10', stroke: '#60a5fa' },
    C: { color: 'text-amber-400', ring: 'ring-amber-400/40', bg: 'bg-amber-400/10', stroke: '#fbbf24' },
    D: { color: 'text-orange-400', ring: 'ring-orange-400/40', bg: 'bg-orange-400/10', stroke: '#fb923c' },
    F: { color: 'text-red-400', ring: 'ring-red-400/40', bg: 'bg-red-400/10', stroke: '#f87171' },
  }
  return configs[scoreResult.value.grade] || configs['F']
})
const circumference = 2 * Math.PI * 36
const scoreDashArray = computed(() => {
  if (!scoreResult.value) return `0 ${circumference}`
  const progress = (scoreResult.value.score / 100) * circumference
  return `${progress.toFixed(1)} ${circumference.toFixed(1)}`
})

function signalIcon(type: string) {
  return ({ critical: '✖', warning: '▲', positive: '✔', info: 'ℹ' } as any)[type] || '•'
}
function signalColor(type: string) {
  return ({
    critical: 'text-red-400 bg-red-400/10',
    warning: 'text-amber-400 bg-amber-400/10',
    positive: 'text-emerald-400 bg-emerald-400/10',
    info: 'text-blue-400 bg-blue-400/10',
  } as any)[type] || 'text-zinc-400 bg-zinc-800'
}
function barColor(score: number) {
  return score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
}
</script>

<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
    <!-- AMBIENT GLOW BG -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full opacity-40"
        style="background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)" />
      <div class="absolute -bottom-60 -right-60 w-[700px] h-[700px] rounded-full opacity-40"
        style="background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)" />
    </div>

    <!-- STICKY NAV -->
    <nav class="relative z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md sticky top-0">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <svg class="w-7 h-7 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="22" fill="#09090b"/>
            <rect x="1" y="1" width="98" height="98" rx="21" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.5"/>
            <path d="M10 50 L28 50 L36 20 L46 80 L54 36 L62 50 L90 50" stroke="#10b981" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="font-semibold tracking-tight text-sm">npm Pulse</span>
          <span class="hidden sm:inline text-xs text-zinc-700 border border-zinc-800/80 rounded px-1.5 py-0.5 font-mono">v0.1</span>
        </div>
        <div class="flex items-center gap-5 text-sm text-zinc-500">
          <a href="/docs" class="hover:text-zinc-200 transition-colors duration-150">Docs</a>
          <a href="/pricing" class="hover:text-zinc-200 transition-colors duration-150">Pricing</a>          <a href="https://github.com/hamdibenjarrar/npm-Pulse" target="_blank"
            class="flex items-center gap-1.5 hover:text-zinc-200 transition-colors duration-150">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </nav>

    <!-- HERO SECTION -->
    <section class="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-12">
      <div class="max-w-2xl">
        <div class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-xs text-emerald-400 mb-6 select-none">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
          Free tier · No API key required
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-5">
          Know every package<br>
          <span class="text-zinc-500">before you install it.</span>
        </h1>

        <p class="text-zinc-400 text-lg mb-10 max-w-lg leading-relaxed">
          Transparent health scores, security analysis, and maintenance insights
          for any npm package. Open algorithm. One API call.
        </p>

        <!-- SEARCH FORM -->
        <form class="flex gap-3 max-w-xl" @submit.prevent="analyzePackage">
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Try react, @nuxt/kit, lodash..."
              class="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-4 py-3.5
                     text-zinc-100 placeholder-zinc-600 text-sm
                     focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
                     transition-all duration-200 pr-14"
            />
            <kbd class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 hidden sm:block pointer-events-none select-none">↵</kbd>
          </div>
          <button
            type="submit"
            :disabled="isLoading || !searchQuery.trim()"
            class="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
                   disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed
                   rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap"
          >
            {{ isLoading ? 'Analyzing...' : 'Analyze' }}
          </button>
        </form>
        <!-- Quick suggestions -->
        <div class="mt-3 flex items-center gap-1 flex-wrap">
          <span class="text-xs text-zinc-700 mr-1">Try:</span>
          <button v-for="pkg in ['react', 'vue', 'lodash', 'express', '@nuxt/kit']" :key="pkg"
            class="text-xs text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 px-2 py-0.5 rounded transition-colors duration-150"
            @click="quickSearch(pkg)">{{ pkg }}</button>
        </div>

        <!-- Error state -->
        <p v-if="error" class="mt-3 text-red-400 text-sm flex items-center gap-2">
          <span class="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-xs flex-shrink-0">✖</span>
          {{ error }}
        </p>
      </div>
    </section>

    <!-- SCORE RESULT CARD -->
    <section v-if="scoreResult" class="relative z-10 max-w-5xl mx-auto px-6 pb-16">
      <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">

        <!-- Header: Grade ring + name + meta -->
        <div class="px-8 pt-8 pb-6 border-b border-zinc-800/80">
          <div class="flex items-start gap-6">
            <!-- Animated SVG Score Ring -->
            <div class="relative flex-shrink-0 select-none">
              <svg width="90" height="90" class="-rotate-90" style="filter: drop-shadow(0 0 8px currentColor)">
                <circle cx="45" cy="45" r="36" fill="none" stroke="#27272a" stroke-width="5"/>
                <circle
                  cx="45" cy="45" r="36" fill="none"
                  :stroke="gradeConfig.stroke"
                  stroke-width="5"
                  stroke-linecap="round"
                  :stroke-dasharray="scoreDashArray"
                  style="transition: stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-black leading-none" :class="gradeConfig.color">{{ scoreResult.grade }}</span>
                <span class="text-xs text-zinc-500 font-medium mt-0.5">{{ scoreResult.score }}/100</span>
              </div>
            </div>
            <div class="flex-1 min-w-0 pt-1">
              <div class="flex items-center gap-2.5 flex-wrap mb-1.5">
                <h2 class="text-xl font-semibold tracking-tight">{{ scoreResult.package }}</h2>
                <span class="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-700/50">
                  v{{ scoreResult.version }}
                </span>
                <span v-if="scoreResult.meta.cacheHit" class="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-md">cached</span>
              </div>
              <p class="text-sm text-zinc-500 mb-3">
                Analyzed {{ new Date(scoreResult.meta.analyzedAt).toLocaleString() }}
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="src in scoreResult.meta.sources" :key="src"
                  class="text-xs text-zinc-700 bg-zinc-800/60 border border-zinc-800 px-2 py-0.5 rounded font-mono"
                >{{ src }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Score Breakdown Bars -->
        <div class="px-8 py-6 border-b border-zinc-800/80">
          <p class="text-xs text-zinc-600 uppercase tracking-widest mb-5 font-medium">Score Breakdown</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <div v-for="[key, dim] in Object.entries(scoreResult.breakdown)" :key="key">
              <div class="flex justify-between items-baseline mb-1.5">
                <span class="text-xs text-zinc-400 capitalize font-medium">{{ key }}</span>
                <span class="text-sm font-bold tabular-nums" :style="{ color: barColor(dim.score) }">{{ dim.score }}</span>
              </div>
              <div class="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${dim.score}%`, backgroundColor: barColor(dim.score), transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }"
                />
              </div>
              <p class="text-xs text-zinc-700 mt-1">{{ dim.weight }}% weight</p>
            </div>
          </div>
        </div>
        <!-- Signals -->
        <div v-if="scoreResult.signals?.length" class="px-8 py-6 border-b border-zinc-800/80">
          <p class="text-xs text-zinc-600 uppercase tracking-widest mb-4 font-medium">Signals</p>
          <div class="grid sm:grid-cols-2 gap-2">
            <div
              v-for="signal in scoreResult.signals.slice(0, 8)" :key="signal.code"
              class="flex items-center gap-2.5"
            >
              <span
                class="w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0 font-bold select-none"
                :class="signalColor(signal.type)"
              >{{ signalIcon(signal.type) }}</span>
              <span class="text-xs text-zinc-400 leading-relaxed">{{ signal.message }}</span>
            </div>
          </div>
        </div>

        <!-- API endpoint with copy -->
        <div class="px-8 py-5">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs text-zinc-600 uppercase tracking-widest font-medium">API Endpoint</p>
            <button
              class="text-xs px-2.5 py-1 rounded-md transition-all duration-150 flex items-center gap-1.5"
              :class="copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'"
              @click="copyEndpoint"
            >
              <span>{{ copied ? '✔ Copied!' : '⎘ Copy curl' }}</span>
            </button>
          </div>
          <div class="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-4 py-3 font-mono text-xs text-zinc-300 overflow-x-auto">
            <span class="text-zinc-600 select-none">$ </span>curl https://npm-pulse.vercel.app/api/v1/score/<span class="text-emerald-400">{{ scoreResult.package }}</span>
          </div>
        </div>

      </div>
    </section>
    <!-- API ENDPOINTS SECTION -->
    <section class="relative z-10 max-w-5xl mx-auto px-6 py-16 border-t border-zinc-800/50">
      <div class="flex items-end gap-3 mb-3">
        <h2 class="text-2xl font-bold">One call. Full picture.</h2>
        <span class="text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded font-mono mb-0.5">REST API</span>
      </div>
      <p class="text-zinc-400 mb-10 max-w-lg">
        Three endpoints cover every use case. No API key for free tier.
      </p>

      <div class="grid md:grid-cols-3 gap-4">
        <div class="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-all duration-200">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs font-bold font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">GET</span>
            <span class="text-xs text-zinc-600">Single Score</span>
          </div>
          <code class="text-xs text-zinc-400 block mb-3 font-mono">/api/v1/score/:package</code>
          <p class="text-sm text-zinc-500 leading-relaxed">
            Full health analysis. Supports scoped packages and specific versions.
          </p>
          <p class="text-xs text-zinc-700 mt-3 font-mono">react · @nuxt/kit · react@18.2.0</p>
        </div>

        <div class="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-all duration-200">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs font-bold font-mono text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded">POST</span>
            <span class="text-xs text-zinc-600">Batch Analysis</span>
          </div>
          <code class="text-xs text-zinc-400 block mb-3 font-mono">/api/v1/batch</code>
          <p class="text-sm text-zinc-500 leading-relaxed">
            Audit your entire package.json. Up to 50 packages in one request.
          </p>
          <p class="text-xs text-zinc-700 mt-3 font-mono">{"packages": [...]}</p>
        </div>
        <div class="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-all duration-200">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs font-bold font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">GET</span>
            <span class="text-xs text-zinc-600">Compare</span>
          </div>
          <code class="text-xs text-zinc-400 block mb-3 font-mono">/api/v1/compare?packages=a,b</code>
          <p class="text-sm text-zinc-500 leading-relaxed">
            Side-by-side comparison of 2–5 packages with a recommendation.
          </p>
          <p class="text-xs text-zinc-700 mt-3 font-mono">react,vue,svelte</p>
        </div>
      </div>
    </section>

    <!-- SCORING DIMENSIONS -->
    <section class="relative z-10 max-w-5xl mx-auto px-6 py-16 border-t border-zinc-800/50">
      <h2 class="text-2xl font-bold mb-2">Transparent by design.</h2>
      <p class="text-zinc-400 mb-10 max-w-lg">Every score is explainable. Every factor is documented. No black boxes.</p>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="dim in dimensions" :key="dim.name"
          class="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-all duration-200">
          <div class="text-3xl font-black mb-2" :class="dim.color">{{ dim.weight }}%</div>
          <h3 class="font-semibold capitalize mb-1 text-sm">{{ dim.name }}</h3>
          <p class="text-xs text-zinc-600 italic mb-3">"{{ dim.question }}"</p>
          <p class="text-xs text-zinc-700 leading-relaxed">{{ dim.factors }}</p>
        </div>
      </div>
    </section>
    <!-- DATA SOURCES -->
    <section class="relative z-10 max-w-5xl mx-auto px-6 py-10 border-t border-zinc-800/50">
      <p class="text-xs text-zinc-700 uppercase tracking-widest mb-5 font-medium">Powered by public APIs — no vendor lock-in</p>
      <div class="flex flex-wrap gap-3">
        <div v-for="src in dataSources" :key="src.name"
          class="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-2.5 text-xs transition-colors duration-150">
          <span class="text-base select-none">{{ src.icon }}</span>
          <div>
            <p class="text-zinc-300 font-medium">{{ src.name }}</p>
            <p class="text-zinc-600">{{ src.role }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING SNAPSHOT -->
    <section class="relative z-10 max-w-5xl mx-auto px-6 py-16 border-t border-zinc-800/50">
      <div class="flex items-end justify-between mb-10">
        <div>
          <h2 class="text-2xl font-bold mb-1">Simple pricing.</h2>
          <p class="text-zinc-400 text-sm">Start free. Scale when you need to.</p>
        </div>
        <a href="/pricing" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-150 flex items-center gap-1 mb-1">
          View full details <span>→</span>
        </a>
      </div>

      <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="plan in plans" :key="plan.name"
          class="rounded-xl p-5 border transition-all duration-200"
          :class="plan.featured
            ? 'bg-emerald-950/30 border-emerald-500/30 ring-1 ring-emerald-500/10'
            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'"
        >
          <div v-if="plan.featured" class="text-xs text-emerald-400 font-bold mb-2 uppercase tracking-widest">Popular</div>
          <h3 class="font-semibold mb-0.5 text-sm">{{ plan.name }}</h3>
          <div class="text-2xl font-black mb-3">
            {{ plan.price }}<span v-if="plan.period" class="text-sm text-zinc-500 font-normal">{{ plan.period }}</span>
          </div>
          <ul class="space-y-1.5">
            <li v-for="f in plan.features" :key="f" class="text-xs text-zinc-500 flex items-start gap-1.5">
              <span class="text-emerald-600 flex-shrink-0 mt-0.5 select-none">✓</span>{{ f }}
            </li>
          </ul>
        </div>
      </div>
    </section>
    <!-- FOOTER -->
    <footer class="relative z-10 border-t border-zinc-800/50">
      <div class="max-w-5xl mx-auto px-6 py-10">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <div class="flex items-center gap-2.5 mb-1.5">
              <svg class="w-6 h-6 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="22" fill="#09090b"/>
                <rect x="1" y="1" width="98" height="98" rx="21" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.5"/>
                <path d="M10 50 L28 50 L36 20 L46 80 L54 36 L62 50 L90 50" stroke="#10b981" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="text-sm font-semibold text-zinc-300">npm Pulse</span>
              <span class="text-zinc-700">·</span>
              <span class="text-sm text-zinc-600">by <span class="text-zinc-400 font-semibold tracking-wide">MYNTHISM</span></span>
            </div>
            <p class="text-xs text-zinc-700">Package intelligence for the npm ecosystem.</p>
          </div>
          <div class="flex flex-wrap items-center gap-5 text-sm text-zinc-600">
            <a href="/docs" class="hover:text-zinc-400 transition-colors duration-150">Docs</a>
            <a href="/pricing" class="hover:text-zinc-400 transition-colors duration-150">Pricing</a>
            <a href="https://github.com/hamdibenjarrar/npm-Pulse" target="_blank" class="hover:text-zinc-400 transition-colors duration-150">GitHub</a>
            <a href="https://npmx.dev" target="_blank" class="hover:text-zinc-400 transition-colors duration-150">npmx.dev</a>
          </div>
        </div>
      </div>
    </footer>

  </div>
</template>

<script lang="ts">
const dimensions = [
  {
    name: 'maintenance',
    weight: 30,
    color: 'text-emerald-400',
    question: 'Is someone home?',
    factors: 'Publish recency, release frequency, maintainer count, commit activity, archived status',
  },
  {
    name: 'quality',
    weight: 25,
    color: 'text-blue-400',
    question: 'Is it well-built?',
    factors: 'TypeScript types, module format, license, description, repository link, dependency count',
  },  {
    name: 'security',
    weight: 25,
    color: 'text-red-400',
    question: 'Is it safe to use?',
    factors: 'Known CVEs via OSV.dev, severity level, bus factor risk, dependency attack surface',
  },
  {
    name: 'popularity',
    weight: 20,
    color: 'text-amber-400',
    question: 'Does the community trust it?',
    factors: 'Weekly downloads (log scale), download trend, GitHub stars',
  },
]

const dataSources = [
  { icon: '📦', name: 'npm Registry', role: 'Package metadata' },
  { icon: '📊', name: 'npm Downloads', role: 'Download counts & trends' },
  { icon: '🛡️', name: 'OSV.dev', role: 'Vulnerability database' },
  { icon: '⭐', name: 'GitHub API', role: 'Stars & commit activity' },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    featured: false,
    features: ['100 API calls/day', 'Basic scores', 'Single package analysis', 'Community support'],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    featured: true,
    features: ['10,000 calls/day', 'Full factor breakdown', 'Batch (50 packages)', 'Webhooks'],
  },
  {
    name: 'Team',
    price: '$99',
    period: '/mo',
    featured: false,
    features: ['50,000 calls/day', 'CI/CD integration', 'Slack/Discord alerts', 'Historical trends'],
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: '/mo',
    featured: false,
    features: ['Unlimited calls', 'Custom scoring rules', 'SBOM export', 'SLA + dedicated support'],
  },
]
</script>