#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# npm Pulse — Launch Script
# Run this after cloning to get up and running
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  npm Pulse — Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Install dependencies
echo "→ Installing dependencies..."
pnpm install

# Step 2: Create .env if not exists
if [ ! -f .env ]; then
  echo "→ Creating .env from .env.example..."
  cp .env.example .env
  echo "  ⚠️  Edit .env with your Supabase credentials"
  echo ""
fi

# Step 3: Check if Supabase is configured
if grep -q "your-project" .env 2>/dev/null; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ⚠️  SETUP REQUIRED"
  echo ""
  echo "  1. Create a Supabase project at https://supabase.com"
  echo "  2. Run the SQL migration in Supabase SQL Editor:"
  echo "     → supabase/migrations/001_initial_schema.sql"
  echo "  3. Update .env with your Supabase URL and keys"
  echo "  4. (Optional) Add a GitHub token for higher rate limits"
  echo ""
  echo "  Then run: pnpm dev"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi

# Step 4: Start dev server
echo "→ Starting dev server..."
echo ""
pnpm dev
