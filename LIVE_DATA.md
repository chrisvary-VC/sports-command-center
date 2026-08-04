# VaryCave SportsCenter v4 Live Data

## Current behavior

The dashboard ships in `mock` mode and remains fully usable on GitHub Pages. The new `data-client.js` resolves a data source before loading the dashboard, uses a short browser cache, and automatically falls back to bundled demo data when the gateway is unavailable.

## Enable live mode

1. Deploy `worker/worker.js` to Cloudflare Workers.
2. Add provider secrets as Worker environment variables. Never put API keys in `config.js`.
3. Add normalized provider adapters inside the Worker.
4. Set `DASHBOARD_CONFIG.data.endpoint` to the Worker `/api/sports` URL.
5. Change `DASHBOARD_CONFIG.data.mode` from `mock` to `live`.

## Cloudflare account setup

1. Create or sign in to a Cloudflare account and open **Workers & Pages**.
2. From the `worker` directory, run `npx wrangler login` and approve the browser authorization.
3. Run `npx wrangler deploy`. The included `wrangler.jsonc` publishes `worker.js` as `varycave-sports-gateway`.
4. Confirm that `https://varycave-sports-gateway.<your-subdomain>.workers.dev/health` returns an `ok` response.
5. In the Worker dashboard, open **Settings → Variables and Secrets**. Add every provider API key as a **Secret**, never as plain text in this project.
6. Add provider adapters to `worker.js` and normalize their responses to the payload contract below.
7. Put the deployed `/api/sports` URL into `config.js`, change data mode to `live`, and test the health endpoint and dashboard fallback.

Cloudflare is the secure gateway, cache, and CORS layer. A separate sports-data provider is still required for scores, schedules, and odds. Keep `.dev.vars` or `.env` files local; this repository ignores both.

## Normalized payload contract

```json
{
  "events": [],
  "tickerLanes": [],
  "michigan": {},
  "stories": [],
  "generatedAt": "2026-08-04T00:00:00Z",
  "source": "provider-name"
}
```

Every event should include `id`, `league`, `status`, `title`, `away`, `home`, `awayName`, `homeName`, `start`, `venue`, `network`, and optional `score`, `detail`, and `odds`.

All source timestamps must be ISO 8601. The display converts them to `America/Chicago` automatically.
