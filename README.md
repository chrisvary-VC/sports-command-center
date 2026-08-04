# DAKboard Sports Command Center

A portrait-oriented sports dashboard prototype for a Raspberry Pi 5 and DAKboard.

## What is included

- NFL, NBA and MLB cards
- Formula 1 and IndyCar race-control cards
- Rotating hero event
- Breaking-news marquee
- Upcoming-events marquee
- Rotating top stories
- Responsive portrait layout
- Mock data, allowing the visual system to run before APIs are configured

## Run it locally on the Raspberry Pi

From this folder:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

For another computer on the same network, replace `localhost` with the Pi's IP address.

## Put it into DAKboard

1. Host this folder on the Pi or another always-on web server.
2. In a DAKboard Custom Screen, add a Website/iframe block.
3. Set the block URL to the hosted dashboard URL.
4. Stretch the block to fill the portrait canvas.
5. Disable margins and scrollbars where the DAKboard block settings allow it.

DAKboard currently lists Website/iframe, External Data/JSON and HTML/JavaScript widget blocks among its custom-screen features. Availability can depend on plan.

## Recommended next architecture

Browser display:
- `index.html`
- `styles.css`
- `app.js`

Local backend:
- Node.js or Python FastAPI
- API credentials stored in `.env`
- Cached normalized endpoint such as `/api/dashboard`
- Separate refresh rates for live scores, schedules, standings and news

Possible data providers:
- NFL, NBA, MLB and IndyCar: licensed provider such as Sportradar
- Formula 1: OpenF1 for telemetry/session information, subject to its access terms
- News: licensed RSS feeds or provider APIs

Do not place provider API keys in `app.js`.

## Files to edit first

- `mock-data.js`: teams, events, stories and race data
- `styles.css`: accent color, spacing and typography
- `app.js`: rotation timing and future API integration

## Suggested next milestone

Add a local `/api/dashboard` service and replace `window.SPORTS_DATA` with a fetch request. Keep the current mock data as an offline fallback.
