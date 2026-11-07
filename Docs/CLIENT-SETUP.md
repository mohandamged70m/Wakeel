# Client Setup Guide — WhatsApp Auto-Reply + Order Agent

## Recommended: No Docker (native Node) — easiest for clients

Prerequisites: Node 20+ and an Evolution API instance (hosted or local).

### 1. Install dependencies (once)
```
cd "Agent for whatsapp"
npm run setup
```
This installs backend + frontend dependencies.

### 2. Configure environment
```
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```
Fill `backend/.env` (see variables below). Leave `REDIS_URL` empty — messages process inline, no Redis needed.

### 3. Start Evolution API
- **Hosted (recommended, no Docker):** use a free Railway template or any Node host. Set `EVOLUTION_BASE_URL` to that URL.
- **Local native:** clone https://github.com/EvolutionAPI/evolution-api, run `npm install && npm run start`.

Scan the QR with the WhatsApp number you want to use as the bot.

### 4. Run the app
```
npm run dev
```
Backend → http://localhost:3001, Frontend → http://localhost:3000. Press Ctrl+C to stop.

### 5. Connect webhook
In Evolution, set instance webhook URL to `http://<host>:3001/webhooks/whatsapp` and enable `MESSAGES_UPSERT`, `CONNECTION_UPDATE`, `QRCODE_UPDATED`. Token must match `EVOLUTION_WEBHOOK_TOKEN`.

### 6. Test
Send a WhatsApp message to the bot number. You should get a reply (placeholder until OpenAI agent is wired).

---

## Alternative: Docker (if client has Docker)
```
docker compose -f infra/docker-compose.yml up -d
```
Then follow steps 2, 5, 6 above.

---

## Environment variables (backend/.env)
- `EVOLUTION_BASE_URL` — Evolution API URL
- `EVOLUTION_API_KEY` — Evolution API key
- `EVOLUTION_INSTANCE` — instance name (default `main`)
- `EVOLUTION_WEBHOOK_TOKEN` — shared secret for webhook verification
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `OPENAI_API_KEY` — OpenAI API key
- `REDIS_URL` — leave empty for inline processing (no Redis)

## Frontend (frontend/.env.local)
- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`