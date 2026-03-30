// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
  ],

  // Runtime config - environment variables
  runtimeConfig: {
    // Server-only keys
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    githubToken: process.env.GITHUB_TOKEN || '',

    // Public keys (exposed to client)
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    },
  },

  // Nitro server config
  nitro: {
    // Rate limiting and caching
    routeRules: {
      '/api/v1/score/**': {
        cache: { maxAge: 3600 }, // 1 hour cache
        cors: true,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      },
      '/api/v1/batch': {
        cache: { maxAge: 1800 }, // 30 min cache
        cors: true,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
      '/api/v1/compare/**': {
        cache: { maxAge: 3600 },
        cors: true,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    },
  },

  app: {
    head: {
      title: 'npm Pulse — Package Intelligence API',
      meta: [
        { name: 'description', content: 'Transparent health scores, security analysis, and maintenance insights for every npm package.' },
        { property: 'og:title', content: 'npm Pulse' },
        { property: 'og:description', content: 'Package Intelligence API for the npm ecosystem' },
        { name: 'theme-color', content: '#09090b' },
        { property: 'og:image', content: '/logo.svg' },
        { name: 'twitter:card', content: 'summary' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://registry.npmjs.org' },
        { rel: 'preconnect', href: 'https://api.npmjs.org' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
})
