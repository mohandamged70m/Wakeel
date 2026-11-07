# WhatsApp Auto-Reply + Order SaaS

Stack: Next.js 15 (frontend) + NestJS (backend) + Supabase (Postgres/Auth/RLS) + Evolution API + OpenAI.

## Layout
- `Docs/` — PLAN.md, ARCHITECTURE.md, DASHBOARD.md
- `backend/` — NestJS API (webhook, providers, modules)
- `frontend/` — Next.js dashboard
- `infra/` — docker-compose (Evolution + Redis + backend + frontend)

## Quick start (no Docker, recommended)
```
npm run setup          # install backend + frontend deps
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
# fill backend\.env (leave REDIS_URL empty)
npm run dev            # starts backend + frontend together
```
Evolution API runs separately (hosted or `npm run start` in the cloned evolution-api repo). See Docs/CLIENT-SETUP.md.

## Build status
- Backend: `npm run build` passes.
- Frontend: `npm run build` passes (use `--webpack` on Windows if Turbopack fails).

## Notes
- Default WhatsApp provider is Evolution (self-hosted). Meta Cloud API is a stub behind the same interface.
- Default locale/timezone/currency: Arabic / Africa/Cairo / EGP.
- Demo/seed data planned in Phase 5.