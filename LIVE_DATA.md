# VaryCave SportsCenter v6 Live Data

## What is live

The Cloudflare Worker aggregates current scoreboards and schedules for NFL, NBA, MLB, NHL, college football, Formula 1 and IndyCar. It also pulls sports headlines through RSS and builds the normalized payload used by the dashboard.

The Worker caches responses for 45 seconds. The dashboard caches the latest successful payload in the browser and falls back to that payload if a provider is temporarily unavailable.

## Odds

Sportsbook data is optional and requires an API key from The Odds API. Without the key, scores, schedules and news remain live, while odds display as unavailable.

From the `worker` directory:

```bash
npm install
npx wrangler login
npx wrangler secret put ODDS_API_KEY
npm run deploy
```

Copy the resulting `workers.dev` URL.

## Connect the dashboard

After the branch is deployed to GitHub Pages, open:

`https://chrisvary-vc.github.io/sports-command-center/live-setup.html`

Paste the Worker URL and choose **Save & Test**. The URL is stored in that browser. Repeat this once on the Raspberry Pi and once on any iPad or Mac used for previewing.

## Data source labels

- `LIVE`: the newest Worker payload loaded successfully.
- `CACHE`: a recent successful payload is displayed while a refresh runs.
- `STALE`: the last successful payload is displayed because the Worker is unavailable.
- `DEMO`: no Worker URL or usable cached payload is available.

## Provider note

The scoreboard and RSS adapters use public ESPN web feeds. These are practical for a personal display but are not a contracted commercial data license. A production product should replace them with licensed providers such as SportsDataIO or Sportradar. The Worker isolates provider-specific code so that replacement does not require redesigning the dashboard.
