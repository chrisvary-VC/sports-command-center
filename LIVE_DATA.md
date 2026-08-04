# VaryCave SportsCenter v4 Live Data

## Current behavior

The dashboard ships in `mock` mode and remains fully usable on GitHub Pages. The new `data-client.js` resolves a data source before loading the dashboard, uses a short browser cache, and automatically falls back to bundled demo data when the gateway is unavailable.

## Enable live mode

1. Deploy `worker/worker.js` to Cloudflare Workers.
2. Add provider secrets as Worker environment variables. Never put API keys in `config.js`.
3. Add normalized provider adapters inside the Worker.
4. Set `DASHBOARD_CONFIG.data.endpoint` to the Worker `/api/sports` URL.
5. Change `DASHBOARD_CONFIG.data.mode` from `mock` to `live`.

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
