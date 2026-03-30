<!-- pages/pricing.vue — npm Pulse Pricing -->
<script setup lang="ts">
import { ref } from 'vue'

useHead({ title: 'Pricing — npm Pulse' })

const annual = ref(false)

const plans = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    period: '',
    cta: 'Start for free',
    ctaLink: '/docs',
    featured: false,
    color: 'zinc',
    features: [
      { text: '100 API calls per day', included: true },
      { text: 'Single package score', included: true },
      { text: '4-dimension breakdown', included: true },
      { text: 'Signals & warnings', included: true },
      { text: 'Rate limit by IP (no key)', included: true },
      { text: 'Community support', included: true },
      { text: 'Batch analysis', included: false },
      { text: 'Webhooks', included: false },    ],
  },
  {
    name: 'Pro',
    monthlyPrice: 29,
    annualPrice: 24,
    period: '/mo',
    cta: 'Start Pro Trial',
    ctaLink: '#',
    featured: true,
    color: 'emerald',
    features: [
      { text: '10,000 API calls per day', included: true },
      { text: 'Full factor breakdown', included: true },
      { text: 'Batch analysis (50 packages)', included: true },
      { text: 'Compare endpoint', included: true },
      { text: 'Webhooks (score changes)', included: true },
      { text: 'Historical score tracking', included: true },
      { text: 'API key management', included: true },
      { text: 'Email support', included: true },
    ],
  },
  {
    name: 'Team',
    monthlyPrice: 99,
    annualPrice: 82,
    period: '/mo',
    cta: 'Start Team Trial',
    ctaLink: '#',
    featured: false,
    color: 'blue',
    features: [
      { text: '50,000 API calls per day', included: true },
      { text: 'Everything in Pro', included: true },
      { text: 'GitHub Actions integration', included: true },
      { text: 'Slack & Discord alerts', included: true },
      { text: 'Score trend charts', included: true },
      { text: 'Team API key management', included: true },
      { text: 'Custom score thresholds', included: true },
      { text: 'Priority support', included: true },    ],
  },
  {
    name: 'Enterprise',
    monthlyPrice: 299,
    annualPrice: 249,
    period: '/mo',
    cta: 'Contact Us',
    ctaLink: 'mailto:hamdibenjarrar@gmail.com',
    featured: false,
    color: 'violet',
    features: [
      { text: 'Unlimited API calls', included: true },
      { text: 'Everything in Team', included: true },
      { text: 'Custom scoring rules', included: true },
      { text: 'SBOM export (CycloneDX)', included: true },
      { text: 'SLA guarantee (99.9%)', included: true },
      { text: 'Audit logging', included: true },
      { text: 'SSO / SAML support', included: true },
      { text: 'Dedicated support engineer', included: true },
    ],
  },
]

function displayPrice(plan: typeof plans[0]) {
  const price = annual.value ? plan.annualPrice : plan.monthlyPrice
  return price === 0 ? '$0' : `$${price}`
}

function annualSavings(plan: typeof plans[0]) {
  if (plan.monthlyPrice === 0) return 0
  return (plan.monthlyPrice - plan.annualPrice) * 12
}
const planAccentColors: Record<string, string> = {
  zinc: 'border-zinc-700 hover:border-zinc-600',
  emerald: 'border-emerald-500/40 ring-1 ring-emerald-500/10',
  blue: 'border-blue-500/30 hover:border-blue-500/50',
  violet: 'border-violet-500/30 hover:border-violet-500/50',
}

const planCtaColors: Record<string, string> = {
  zinc: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200',
  emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  blue: 'bg-blue-600/80 hover:bg-blue-600 text-white',
  violet: 'bg-violet-600/80 hover:bg-violet-600 text-white',
}

const planPriceColors: Record<string, string> = {
  zinc: 'text-zinc-100',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  violet: 'text-violet-400',
}

const faqs = [
  {
    q: 'Do I need an API key for the free tier?',
    a: 'No. The free tier works without authentication. Requests are rate-limited by IP (100/day). For higher limits, create an API key.',
  },
  {
    q: 'How is the score calculated?',
    a: 'Four dimensions — maintenance (30%), quality (25%), security (25%), popularity (20%) — each with documented, auditable factors. The algorithm is open source on GitHub.',
  },  {
    q: 'Where does the data come from?',
    a: 'npm Registry API (package metadata), npm Downloads API (download counts), OSV.dev (vulnerabilities), and GitHub API (repo activity). All public, all free.',
  },
  {
    q: 'Can I use this in CI/CD?',
    a: 'Yes. The batch endpoint lets you audit your entire package.json. Team and Enterprise plans include GitHub Actions integration that blocks PRs if a dependency drops below your score threshold.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Paid plans are billed monthly or annually with no lock-in. Cancel anytime from your dashboard.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Yes. Pro and Team plans include a 14-day free trial. No credit card required to start.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 antialiased">

    <!-- AMBIENT BG -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20"
        style="background: radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 60%)" />
    </div>

    <!-- NAV -->
    <nav class="relative z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md sticky top-0">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
        <a href="/" class="text-zinc-500 hover:text-zinc-200 transition-colors duration-150 text-sm flex items-center gap-1.5">
          <span>←</span> Back
        </a>
        <span class="text-zinc-700">|</span>
        <span class="font-semibold text-sm">Pricing</span>
      </div>
    </nav>
    <div class="relative z-10 max-w-5xl mx-auto px-6 py-16">

      <!-- HEADER -->
      <div class="text-center mb-12">
        <h1 class="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing.</h1>
        <p class="text-zinc-400 max-w-md mx-auto mb-8">
          Start free. Upgrade when your usage grows. No surprises, no hidden fees.
        </p>

        <!-- BILLING TOGGLE -->
        <div class="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5">
          <button
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            :class="!annual ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'"
            @click="annual = false"
          >Monthly</button>
          <button
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
            :class="annual ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'"
            @click="annual = true"
          >
            Annual
            <span class="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">-17%</span>
          </button>
        </div>
        <p v-if="annual" class="text-xs text-emerald-400 mt-2">Save up to $600/year with annual billing</p>
      </div>
      <!-- PLANS GRID -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        <div
          v-for="plan in plans" :key="plan.name"
          class="bg-zinc-900 border rounded-2xl p-6 flex flex-col transition-all duration-200"
          :class="planAccentColors[plan.color]"
        >
          <!-- Popular badge -->
          <div v-if="plan.featured" class="flex items-center justify-between mb-4">
            <span class="text-xs text-emerald-400 font-bold uppercase tracking-widest bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
              Most Popular
            </span>
          </div>
          <div v-else class="mb-6" />

          <h3 class="text-base font-bold mb-1">{{ plan.name }}</h3>

          <!-- Price -->
          <div class="mb-1 flex items-baseline gap-1">
            <span class="text-3xl font-black" :class="planPriceColors[plan.color]">{{ displayPrice(plan) }}</span>
            <span v-if="plan.monthlyPrice > 0" class="text-zinc-600 text-sm">{{ plan.period }}</span>
          </div>
          <p v-if="annual && plan.monthlyPrice > 0" class="text-xs text-emerald-500 mb-4">
            Save ${{ annualSavings(plan) }}/year
          </p>
          <p v-else class="mb-4 text-xs text-zinc-700 min-h-[1rem]">
            {{ plan.monthlyPrice > 0 && !annual ? 'billed monthly' : '' }}
          </p>
          <!-- CTA -->
          <a
            :href="plan.ctaLink"
            class="block text-center py-2.5 rounded-xl text-sm font-semibold mb-6 transition-all duration-200"
            :class="planCtaColors[plan.color]"
          >{{ plan.cta }}</a>

          <!-- Features -->
          <ul class="space-y-2.5 flex-1">
            <li
              v-for="feature in plan.features" :key="feature.text"
              class="flex items-start gap-2 text-sm"
              :class="feature.included ? 'text-zinc-400' : 'text-zinc-700'"
            >
              <span class="flex-shrink-0 mt-0.5 text-xs font-bold w-4 text-center">
                {{ feature.included ? '✓' : '–' }}
              </span>
              <span>{{ feature.text }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- COMPARISON NOTE -->
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 mb-16 text-center">
        <p class="text-sm text-zinc-400">
          All plans include access to the core API, JSON responses, and public scoring methodology.
          <a href="/docs" class="text-emerald-400 hover:text-emerald-300 ml-1 transition-colors">Read the docs →</a>
        </p>
      </div>
      <!-- FAQ -->
      <div class="max-w-2xl mx-auto">
        <h2 class="text-xl font-semibold mb-8 text-center">Frequently asked questions</h2>
        <div class="space-y-5">
          <div v-for="faq in faqs" :key="faq.q"
            class="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-colors duration-150">
            <h3 class="font-semibold mb-2 text-sm text-zinc-200">{{ faq.q }}</h3>
            <p class="text-sm text-zinc-500 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>

      <!-- CTA FOOTER -->
      <div class="mt-16 text-center">
        <p class="text-zinc-500 text-sm mb-4">Still have questions?</p>
        <a href="mailto:hamdibenjarrar@gmail.com"
          class="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 rounded-xl px-5 py-2.5 transition-all duration-200">
          Contact us →
        </a>
      </div>

    </div>

    <!-- FOOTER -->
    <footer class="relative z-10 border-t border-zinc-800/50 mt-12">
      <div class="max-w-5xl mx-auto px-6 py-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-zinc-400">npm Pulse</span>
            <span class="text-zinc-700">·</span>
            <span class="text-sm text-zinc-600">by <span class="text-zinc-500 font-semibold">MYNTHISM</span></span>
          </div>
          <div class="flex gap-5 text-sm text-zinc-600">
            <a href="/" class="hover:text-zinc-400 transition-colors">Home</a>
            <a href="/docs" class="hover:text-zinc-400 transition-colors">Docs</a>
            <a href="https://github.com/hamdibenjarrar/npm-Pulse" class="hover:text-zinc-400 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>

  </div>
</template>