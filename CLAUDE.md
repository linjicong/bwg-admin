# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BWH Admin — a self-hosted BandwagonHost (搬瓦工) VPS management panel built with Next.js App Router + Ant Design 5, replacing the native KiwiVM control panel. Connects to TiDB Cloud via Drizzle ORM.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint

# Database (Drizzle ORM + TiDB Cloud)
npm run db:push      # Push schema changes to TiDB (no migration files)
npm run db:generate  # Generate migration SQL files
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio GUI
```

## Architecture

### API Proxy Pattern

The frontend never calls KiwiVM API directly. Instead:

1. Client components call `bwhApi("actionName", params)` from `src/lib/api.ts`
2. This POSTs to `/api/bwh` route (`src/app/api/bwh/route.ts`)
3. The route dispatches to typed functions in `src/lib/kiwivm.ts`
4. `kiwivm.ts` calls `api.64clouds.com/v1/{action}` with credentials from env vars

API keys stay server-side only. To add a new API endpoint: add the function to `kiwivm.ts`, register it in the `actions` map in `route.ts`.

### State Management

All pages are client components (`"use client"`) that fetch data on mount via `useEffect`. No global state library — each page manages its own `useState` + loading/error states.

### Database (TiDB Cloud)

- Schema: `src/db/schema.ts` — tables for `vps_config`, `audit_logs`, `operation_logs`
- Connection: `src/lib/db.ts` — mysql2 pool with SSL
- Config: `drizzle.config.ts`
- Uses `mysql2` driver dialect (TiDB is MySQL-compatible)

## Environment Variables

Required in `.env.local`:

```
TIDB_HOST, TIDB_PORT, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE
BWH_VEID, BWH_API_KEY
```

## UI Framework

Ant Design 5 with SSR support via `@ant-design/nextjs-registry` wrapped in root layout. Chinese locale (`antd/locale/zh_CN`) is configured globally.
