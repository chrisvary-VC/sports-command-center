const CACHE_TTL_SECONDS = 60;
const ODDS_CACHE_TTL_SECONDS = 21600;
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const FEEDS = [
  { league: 'NFL', path: 'football/nfl', cdn: 'nfl' },
  { league: 'NBA', path: 'basketball/nba', cdn: 'nba' },
  { league: 'MLB', path: 'baseball/mlb', cdn: 'mlb' },
  { league: 'NHL', path: 'hockey/nhl', cdn: 'nhl' },
  { league: 'NCAAF', path: 'football/college-football', cdn: 'college-football', limit: 100 },
  { league: 'F1', path: 'racing/f1', cdn: 'f1' },
  { league: 'INDYCAR', path: 'racing/irl', cdn: 'irl' }
];

const NEWS_FEEDS = FEEDS.filter(feed => ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'F1'].includes(feed.league));

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
    if (url.pathname === '/' || url.pathname === '/health') {
      return withCors(json({
        ok: true,
        service: 'varycave-sports-gateway',
        version: 10,
        feeds: FEEDS.map(feed => feed.league),
        oddsProvider: env.ODDS_API_KEY ? 'the-odds-api' : 'public-feed-fallback',
        sportsEndpoint: '/api/sports'
      }));
    }
    if (url.pathname !== '/api/sports') return new Response('Not found', { status: 404 });

    const cache = caches.default;
    const cacheKey = new Request(url.origin + '/api/sports?cache-version=11', { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return withCors(cached);

    const [feedResults, news, bookmakerResult] = await Promise.all([
      Promise.allSettled(FEEDS.map(loadFeed)),
      loadNews(),
      env.ODDS_API_KEY ? loadBookmakerMarkets(env, url.origin, ctx).catch(error => ({
        events: [], provider: 'the-odds-api', updatedAt: null, quota: {}, error: String(error)
      })) : Promise.resolve({ events: [], provider: 'public-feed-fallback', updatedAt: null, quota: {} })
    ]);
    const results = feedResults;
    const events = results.flatMap((result, index) => result.status === 'fulfilled'
      ? result.value
      : [{ error: true, league: FEEDS[index].league, message: String(result.reason) }]);
    const validEvents = events.filter(event => !event.error);
    const errors = events.filter(event => event.error);
    if (bookmakerResult.error) errors.push({ error: true, league: 'ODDS', message: bookmakerResult.error });

    if (!validEvents.length) {
      return withCors(json({ events: [], errors, generatedAt: new Date().toISOString(), source: 'espn-public' }, 503));
    }

    const response = json({
      events: validEvents,
      news,
      tickerLanes: FEEDS.map((feed, index) => ({ league: feed.league, direction: index % 2 ? 'right' : 'left' })),
      bookmakerEvents: bookmakerResult.events,
      oddsProvider: bookmakerResult.provider,
      oddsUpdatedAt: bookmakerResult.updatedAt,
      oddsQuota: bookmakerResult.quota,
      generatedAt: new Date().toISOString(),
      source: 'espn-public',
      errors
    });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return withCors(response);
  }
};

async function loadBookmakerMarkets(env, origin, ctx) {
  const cache = caches.default;
  const cacheSeconds = Math.max(300, Number(env.ODDS_CACHE_TTL_SECONDS) || ODDS_CACHE_TTL_SECONDS);
  const cacheKey = new Request(`${origin}/internal/bookmaker-markets?cache-version=1`, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached.json();

  const query = new URLSearchParams({
    apiKey: env.ODDS_API_KEY,
    regions: 'us',
    markets: 'h2h,spreads,totals',
    oddsFormat: 'american',
    dateFormat: 'iso'
  });
  const response = await fetch(`${ODDS_API_BASE}/sports/upcoming/odds?${query}`, {
    headers: { accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`The Odds API returned ${response.status}`);
  const payload = await response.json();
  const result = {
    events: payload.map(normalizeBookmakerEvent).filter(event => event.bookmakers.length),
    provider: 'the-odds-api',
    updatedAt: new Date().toISOString(),
    quota: {
      remaining: response.headers.get('x-requests-remaining'),
      used: response.headers.get('x-requests-used'),
      last: response.headers.get('x-requests-last')
    }
  };
  const cachedResponse = new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${cacheSeconds}` }
  });
  ctx.waitUntil(cache.put(cacheKey, cachedResponse));
  return result;
}

function normalizeBookmakerEvent(event) {
  return {
    id: event.id,
    league: oddsLeague(event.sport_key, event.sport_title),
    sportKey: event.sport_key,
    awayName: event.away_team,
    homeName: event.home_team,
    start: event.commence_time,
    bookmakers: (event.bookmakers || []).map(bookmaker => ({
      key: bookmaker.key,
      title: bookmaker.title,
      lastUpdate: bookmaker.last_update,
      markets: (bookmaker.markets || []).map(market => ({
        key: market.key,
        lastUpdate: market.last_update,
        outcomes: (market.outcomes || []).map(outcome => ({
          name: outcome.name,
          price: outcome.price,
          ...(outcome.point == null ? {} : { point: outcome.point })
        }))
      }))
    })).filter(bookmaker => bookmaker.markets.length)
  };
}

function oddsLeague(key, title) {
  return ({
    americanfootball_nfl: 'NFL',
    americanfootball_ncaaf: 'NCAAF',
    basketball_nba: 'NBA',
    baseball_mlb: 'MLB',
    icehockey_nhl: 'NHL'
  })[key] || String(title || key || 'SPORT').toUpperCase();
}

async function loadFeed(feed) {
  if (feed.league === 'F1') return loadF1Feed();
  if (feed.league === 'INDYCAR') return loadRaceFeed(feed);
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
  let events = payload.events || [];
  if (events.length < 6) {
    const scheduleEvents = await loadForwardSchedule(feed, events[0]).catch(() => []);
    const seen = new Set(events.map(event => event.id || event.uid));
    events = [...events, ...scheduleEvents.filter(event => !seen.has(event.id || event.uid))];
  }
  return events.map(event => normalizeEvent(event, feed.league)).filter(Boolean);
}

async function loadF1Feed() {
  const year = new Date().getUTCFullYear();
  const response = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json`, {
    headers: { accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`F1 schedule feed returned ${response.status}`);
  const payload = await response.json();
  const races = payload.MRData?.RaceTable?.Races || [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return races.flatMap(race => {
    const sessions = [
      ['FP1', race.FirstPractice],
      ['FP2', race.SecondPractice],
      ['FP3', race.ThirdPractice],
      ['SPRINT', race.Sprint],
      ['QUALIFYING', race.Qualifying],
      ['RACE', { date: race.date, time: race.time }]
    ].filter(([, session]) => session?.date);
    return sessions.map(([name, session]) => ({
      id: `F1-${race.round}-${name}`,
      league: 'F1',
      eventName: race.raceName,
      session: name,
      status: 'UPCOMING',
      title: `${race.raceName} · ${name}`,
      away: name,
      awayName: name,
      awayLogo: '',
      home: 'F1',
      homeName: race.raceName,
      homeLogo: '',
      start: `${session.date}T${session.time || '00:00:00Z'}`,
      venue: race.Circuit?.circuitName || race.raceName,
      network: 'Apple TV',
      score: '',
      detail: `${name} · ROUND ${race.round}`,
      odds: null
    }));
  }).filter(session => new Date(session.start).getTime() >= cutoff)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 10);
}

async function loadRaceFeed(feed) {
  const year = new Date().getUTCFullYear();
  const response = await fetch(`${ESPN_BASE}/${feed.path}/scoreboard?dates=${year}&limit=100&feed-version=2`, {
    headers: { accept: 'application/json, text/plain, */*' }
  });
  if (!response.ok) throw new Error(`${feed.league} season feed returned ${response.status}`);
  const payload = await response.json();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return (payload.events || [])
    .flatMap(event => normalizeRaceWeekend(event, feed.league))
    .filter(session => new Date(session.start).getTime() >= cutoff)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 10);
}

function normalizeRaceWeekend(event, league) {
  const sessions = event.competitions || [];
  const raceName = event.shortName || event.name || `${league} RACE WEEKEND`;
  const location = raceName.replace(/^(Heineken|Qatar Airways|Pirelli|MSC Cruises|Lenovo|AWS|Crypto\.com)\s+/i, '');
  return sessions.map((competition, index) => {
    const type = competition.type?.abbreviation || (index === sessions.length - 1 ? 'RACE' : `SESSION ${index + 1}`);
    const status = competition.status || event.status || {};
    const statusText = status.type?.shortDetail || status.type?.detail || 'UPCOMING';
    const isStarted = Boolean(status.type?.state && status.type.state !== 'pre');
    return {
      id: competition.id || `${event.id}-${type}`,
      league,
      eventName: raceName,
      session: type.toUpperCase(),
      status: statusText.toUpperCase(),
      title: `${raceName} · ${type}`,
      away: type.toUpperCase(),
      awayName: type.toUpperCase(),
      awayLogo: '',
      home: league,
      homeName: location,
      homeLogo: '',
      start: competition.date || event.date,
      venue: competition.venue?.fullName || location,
      network: competition.broadcasts?.[0]?.names?.join(' / ') || '',
      score: isStarted ? (statusText || type).toUpperCase() : '',
      detail: statusText,
      odds: null
    };
  });
}

async function loadNews() {
  const results = await Promise.allSettled(NEWS_FEEDS.map(async feed => {
    const response = await fetch(`${ESPN_BASE}/${feed.path}/news?limit=4&feed-version=2`, {
      headers: { accept: 'application/json, text/plain, */*' }
    });
    if (!response.ok) throw new Error(`${feed.league} news returned ${response.status}`);
    const payload = await response.json();
    return (payload.articles || []).map(article => ({
      id: article.id || article.links?.web?.href,
      league: feed.league,
      headline: article.headline || article.title,
      description: article.description || '',
      image: article.images?.[0]?.url || '',
      url: article.links?.web?.href || '',
      byline: article.byline || 'ESPN',
      published: article.published || article.lastModified || null
    })).filter(article => article.headline);
  }));
  const articles = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const seen = new Set();
  return articles.filter(article => article.id && !seen.has(article.id) && seen.add(article.id)).slice(0, 12);
}

async function loadForwardSchedule(feed, firstEvent) {
  const eventDate = new Date(firstEvent?.date || Date.now());
  let scheduleUrl;
  if (feed.league === 'NFL') {
    scheduleUrl = `https://cdn.espn.com/core/nfl/schedule?xhr=1&year=${eventDate.getUTCFullYear()}&seasontype=1&week=2`;
  } else {
    eventDate.setUTCDate(eventDate.getUTCDate() + 7);
    const date = eventDate.toISOString().slice(0, 10).replaceAll('-', '');
    scheduleUrl = `https://cdn.espn.com/core/${feed.cdn}/schedule?xhr=1&date=${date}`;
  }
  const response = await fetch(scheduleUrl, {
    headers: { 'accept': 'application/json, text/plain, */*' },
    cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true }
  });
  if (!response.ok) return [];
  const payload = await response.json();
  const schedule = payload.content?.schedule || {};
  return Object.values(schedule).flatMap(day => day.games || []);
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
