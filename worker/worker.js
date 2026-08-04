const CACHE_TTL_SECONDS = 60;
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const FEEDS = [
  { league: 'NFL', path: 'football/nfl', cdn: 'nfl' },
  { league: 'NBA', path: 'basketball/nba', cdn: 'nba' },
  { league: 'MLB', path: 'baseball/mlb', cdn: 'mlb' },
  { league: 'NHL', path: 'hockey/nhl', cdn: 'nhl' },
  { league: 'NCAAF', path: 'football/college-football', cdn: 'college-football', limit: 100 },
  { league: 'F1', path: 'racing/f1', cdn: 'f1' },
  { league: 'INDYCAR', path: 'racing/irl', cdn: 'irl' }
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
    if (url.pathname === '/' || url.pathname === '/health') {
      return withCors(json({
        ok: true,
        service: 'varycave-sports-gateway',
        version: 5,
        feeds: FEEDS.map(feed => feed.league),
        sportsEndpoint: '/api/sports'
      }));
    }
    if (url.pathname !== '/api/sports') return new Response('Not found', { status: 404 });

    const cache = caches.default;
    const cacheKey = new Request(url.origin + '/api/sports?cache-version=6', { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return withCors(cached);

    const results = await Promise.allSettled(FEEDS.map(loadFeed));
    const events = results.flatMap((result, index) => result.status === 'fulfilled'
      ? result.value
      : [{ error: true, league: FEEDS[index].league, message: String(result.reason) }]);
    const validEvents = events.filter(event => !event.error);
    const errors = events.filter(event => event.error);

    if (!validEvents.length) {
      return withCors(json({ events: [], errors, generatedAt: new Date().toISOString(), source: 'espn-public' }, 503));
    }

    const response = json({
      events: validEvents,
      tickerLanes: FEEDS.map((feed, index) => ({ league: feed.league, direction: index % 2 ? 'right' : 'left' })),
      generatedAt: new Date().toISOString(),
      source: 'espn-public',
      errors
    });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return withCors(response);
  }
};

async function loadFeed(feed) {
  const query = new URLSearchParams({ limit: String(feed.limit || 50) });
  let response = await fetch(`${ESPN_BASE}/${feed.path}/scoreboard?${query}`, {
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'origin': 'https://www.espn.com',
      'referer': 'https://www.espn.com/'
    },
    cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true }
  });
  let payload;
  if (response.ok) {
    payload = await response.json();
  } else {
    response = await fetch(`https://cdn.espn.com/core/${feed.cdn}/scoreboard?xhr=1&limit=${feed.limit || 50}`, {
      headers: { 'accept': 'application/json, text/plain, */*' },
      cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true }
    });
    if (!response.ok) throw new Error(`${feed.league} feeds returned ${response.status}`);
    const cdnPayload = await response.json();
    payload = cdnPayload.content?.sbData || cdnPayload;
  }
  return (payload.events || []).map(event => normalizeEvent(event, feed.league)).filter(Boolean);
}

function normalizeEvent(event, league) {
  const competition = event.competitions?.[0];
  if (!competition) return null;
  const competitors = competition.competitors || [];
  const away = competitors.find(team => team.homeAway === 'away') || competitors[0];
  const home = competitors.find(team => team.homeAway === 'home') || competitors[1];
  if (!away || !home) return null;
  const status = competition.status || event.status || {};
  const statusText = status.type?.shortDetail || status.type?.detail || 'UPCOMING';
  const isStarted = Boolean(status.type?.state && status.type.state !== 'pre');
  const broadcast = competition.broadcasts?.[0]?.names?.join(' / ') || competition.geoBroadcasts?.[0]?.media?.shortName || '';
  const odds = normalizeOdds(competition.odds?.[0]);
  return {
    id: event.id || `${league}-${away.team?.abbreviation}-${home.team?.abbreviation}`,
    league,
    status: statusText.toUpperCase(),
    title: event.name || `${away.team?.displayName} at ${home.team?.displayName}`,
    away: away.team?.abbreviation || away.team?.shortDisplayName || 'AWAY',
    awayName: away.team?.shortDisplayName || away.team?.displayName || 'AWAY',
    awayLogo: away.team?.logo || away.team?.logos?.[0]?.href || '',
    home: home.team?.abbreviation || home.team?.shortDisplayName || 'HOME',
    homeName: home.team?.shortDisplayName || home.team?.displayName || 'HOME',
    homeLogo: home.team?.logo || home.team?.logos?.[0]?.href || '',
    start: event.date || competition.date,
    venue: competition.venue?.fullName || competition.venue?.address?.city || '',
    network: broadcast,
    score: isStarted ? `${away.score || '0'} — ${home.score || '0'}` : '',
    detail: statusText,
    odds
  };
}

function normalizeOdds(source) {
  if (!source) return null;
  const spread = source.details || (source.spread != null ? String(source.spread) : '');
  const awayMoneyline = source.awayTeamOdds?.moneyLine;
  const homeMoneyline = source.homeTeamOdds?.moneyLine;
  return {
    spread,
    moneyline: awayMoneyline || homeMoneyline ? `${formatLine(awayMoneyline)} · ${formatLine(homeMoneyline)}` : '',
    total: source.overUnder != null ? `O/U ${source.overUnder}` : ''
  };
}

function formatLine(value) {
  if (value == null) return '—';
  const number = Number(value);
  return number > 0 ? `+${number}` : String(number);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${CACHE_TTL_SECONDS}`
    }
  });
}

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET, OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  return new Response(response.body, { status: response.status, headers });
}
