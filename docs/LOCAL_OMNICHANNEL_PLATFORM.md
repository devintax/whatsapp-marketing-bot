# Local Omnichannel Platform Plan

This project is moving from a single WhatsApp Web marketing bot toward a local-first omnichannel marketing platform.

## Local Infrastructure

Use `docker-compose.local.yml` for local platform services:

```bash
docker compose -f docker-compose.local.yml up -d
```

Services:

- Redis: `redis://localhost:6379`
- Local media service: `http://localhost:8082/media`
- Public tunnel domain: `https://bot.dfgworld.net`

Backend defaults:

- `REDIS_URL=redis://localhost:6379`
- `UPLOAD_PATH=./uploads`
- `MEDIA_PUBLIC_URL=http://localhost:5000`
- `PRIMARY_AI_MODEL=local_llm`
- `FALLBACK_AI_MODEL=openrouter`
- `BOT_PUBLIC_URL=https://bot.dfgworld.net`

For a dedicated local CDN, set:

```env
MEDIA_PUBLIC_URL=http://localhost:8082
```

The backend serves uploaded files from both `/uploads` and `/media`. `/uploads` is kept for backward compatibility; `/media` is the preferred local CDN path.

## Local LLM First

The AI service supports OpenAI-compatible local inference endpoints. This works with local servers such as Ollama's OpenAI-compatible API, LM Studio, llama.cpp server, vLLM, and similar gateways.

```env
PRIMARY_AI_MODEL=local_llm
FALLBACK_AI_MODEL=openrouter
LOCAL_LLM_BASE_URL=http://localhost:11434/v1
LOCAL_LLM_API_KEY=local-llm
LOCAL_LLM_MODEL=llama3.1:8b

OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=WhatsApp Marketing Bot
```

Keep real keys in `backend/.env`, never in `.env.example` or documentation.

## Cloudflared Public Edge

Use `bot.dfgworld.net` as the public domain for the locally hosted stack.

```env
BOT_PUBLIC_URL=https://bot.dfgworld.net
PUBLIC_BASE_URL=https://bot.dfgworld.net
CLOUDFLARED_TUNNEL_TOKEN=
```

Start the optional tunnel profile from the repo root:

```bash
docker compose -f docker-compose.local.yml --profile tunnel up -d cloudflared
```

The tunnel token should be stored in a local `.env` file, deployment secret, or the host's environment. Do not commit it.

## Channel Direction

The existing `backend/routes/whatsapp.js` route continues to run the current `whatsapp-web.js` QR-based flow.

New channel health endpoints are available at:

- `GET /api/channels`
- `GET /api/channels/health`

These endpoints are authenticated and report configured channel adapters:

- `whatsapp_web`: current built-in WhatsApp Web.js sender
- `openwa`: self-hosted OpenWA adapter
- `waha`: self-hosted WAHA HTTP API adapter
- `wazo`: local Wazo voice, SMS, and telephony adapter

## Adapter Environment

```env
OPENWA_ENABLED=false
OPENWA_BASE_URL=http://localhost:8085
OPENWA_HEALTH_URL=http://localhost:8085/health
OPENWA_API_KEY=

WAHA_ENABLED=false
WAHA_BASE_URL=http://localhost:3001
WAHA_HEALTH_URL=http://localhost:3001/api/sessions
WAHA_API_KEY=
WAHA_SESSION=default

WAZO_ENABLED=false
WAZO_BASE_URL=http://localhost:9486
WAZO_HEALTH_URL=http://localhost:9486/api
WAZO_TOKEN=
```

## Next Build Steps

1. Add send adapters for OpenWA and WAHA behind a shared WhatsApp channel interface.
2. Add Wazo contact actions for call, SMS, and campaign follow-up workflows.
3. Move campaign sending from direct `whatsapp-web.js` calls into a channel dispatcher.
4. Add a frontend integrations screen for channel status, test send, and failover order.
5. Add an AI settings screen for local LLM health checks, model selection, and OpenRouter fallback.
6. Move high-volume campaign jobs into Redis-backed queues so sending survives restarts.
