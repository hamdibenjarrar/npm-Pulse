<div align="center">

<img src="public/logo-animated.svg" alt="npm Pulse" width="380">

# npm Pulse

**Package Intelligence API** — Know every package before you install it.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-npm--pulse.vercel.app-10b981?style=flat-square&logo=vercel&logoColor=white)](https://npm-pulse.vercel.app)
[![API](https://img.shields.io/badge/API-v0.1-6366f1?style=flat-square)](https://npm-pulse.vercel.app/docs)
[![License](https://img.shields.io/badge/License-MIT-zinc?style=flat-square)](LICENSE)
[![by MYNTHISM](https://img.shields.io/badge/by-MYNTHISM-09090b?style=flat-square)](https://github.com/hamdibenjarrar)

</div>

---

## What is npm Pulse?

npm Pulse is a free, open REST API that computes a **health score** for any npm package — instantly. One API call returns a 0–100 score, an A–F grade, and a breakdown across four transparent dimensions.

No black boxes. No vendor lock-in. Fully open algorithm.

```bash
curl https://npm-pulse.vercel.app/api/v1/score/react
```

```json
{
  "package": "react",
  "version": "19.1.0",
  "score": 87,
  "grade": "B",
  "breakdown": {
    "maintenance": { "score": 91, "weight": 30 },
    "quality":     { "score": 88, "weight": 25 },
    "security":    { "score": 85, "weight": 25 },
    "popularity":  { "score": 82, "weight": 20 }
  },
  "signals": [ ... ]
}
```


## Scoring Algorithm

Every score is built from four weighted dimensions — all documented, all auditable.

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| 🔧 **Maintenance** | 30% | Last publish date, release frequency, open issues ratio, license presence |
| ✅ **Quality** | 25% | TypeScript support, README completeness, test coverage signals, has homepage |
| 🔒 **Security** | 25% | Known CVEs via OSV.dev, days since last security fix, vulnerability severity |
| 📈 **Popularity** | 20% | Weekly downloads (log scale), download trend, GitHub stars |

Final score = `Σ (dimension_score × weight)` → normalized to 0–100 → grade A/B/C/D/F.

---

## API Reference

Base URL: `https://npm-pulse.vercel.app`

### GET `/api/v1/score/:package`

Fetch the Pulse score for any npm package.

```bash
# Basic
curl https://npm-pulse.vercel.app/api/v1/score/lodash

# Scoped package
curl https://npm-pulse.vercel.app/api/v1/score/@nuxt/kit

# Specific version
curl https://npm-pulse.vercel.app/api/v1/score/react@18.2.0
```

### POST `/api/v1/batch`

Audit your entire `package.json` in one request (up to 50 packages).

```bash
curl -X POST https://npm-pulse.vercel.app/api/v1/batch \
  -H "Content-Type: application/json" \
  -d '{"packages": ["react", "vue", "lodash", "express"]}'
```

### GET `/api/v1/compare`

Side-by-side comparison of 2–5 packages with a recommendation.

```bash
curl "https://npm-pulse.vercel.app/api/v1/compare?packages=react,vue,svelte"
```


## Rate Limits

| Tier | Requests/day | Auth required |
|------|-------------|---------------|
| Free | 100 | No — rate limited by IP |
| Pro | 10,000 | Bearer token |
| Team | 100,000 | Bearer token |
| Enterprise | Unlimited | Bearer token |

---

## Data Sources

npm Pulse uses only public APIs — no vendor lock-in, no scraping.

- **npm Registry** — package metadata, versions, license, description
- **npm Downloads API** — weekly/monthly download counts
- **OSV.dev** — open-source vulnerability database
- **GitHub API** — stars, open issues, last commit, contributor activity

---

## Tech Stack

- **Framework** — Nuxt 3 + Nitro (server-side rendering + API routes)
- **UI** — Vue 3, Tailwind CSS, TypeScript
- **Cache** — Supabase (PostgreSQL) with Row-Level Security
- **Deploy** — Vercel (edge network)

---

## Local Development

```bash
# Clone
git clone https://github.com/hamdibenjarrar/npm-Pulse.git
cd npm-Pulse

# Install
pnpm install

# Configure
cp .env.example .env
# Add your SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY

# Run
pnpm dev
# → http://localhost:3000
```

---

## Roadmap

- [ ] GitHub Actions integration (block PRs below score threshold)
- [ ] CLI tool: `npx npm-pulse react`
- [ ] Badge system: embed live scores in READMEs
- [ ] Webhooks for score changes
- [ ] npmx.dev integration (Package Health Score feature)

---

<div align="center">

Built by **[MYNTHISM](https://github.com/hamdibenjarrar)** · MIT License

*Part of the npmx.dev ecosystem*

</div>
