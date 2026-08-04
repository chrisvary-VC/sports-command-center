const LEAGUES = {
  NFL: { path: 'football/nfl', label: 'NFL' },
  NBA: { path: 'basketball/nba', label: 'NBA' },
  MLB: { path: 'baseball/mlb', label: 'MLB' },
  NHL: { path: 'hockey/nhl', label: 'NHL' },
  NCAAF: { path: 'football/college-football', label: 'NCAAF' },
  F1: { path: 'racing/f1', label: 'F1' },
  INDYCAR: { path: 'racing/irl', label: 'INDYCAR' }
};

const TICKER_DIRECTIONS = ['left', 'right', 'left', 'right', 'left', 'right', 'left'];
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const NEWS_FEEDS = [
  ['NFL', 'https://www.espn.com/espn/rss/nfl/news'],
  ['NBA', 'https://www.espn.com/espn/rss/nba/news'],
  ['MLB', 'https://www.espn.com/espn/rss/mlb/news'],
  ['NHL', 'https://www.espn.com/espn/rss/nhl/news'],
  ['NCAAF', 'https://www.espn.com/espn/rss/ncf/news'],
  ['F1', 'https://www.espn.com/espn/rss/rpm/news']
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    if (url.pathname === '/health') return json({ ok: true, service: 'VaryCave Live Data', at: new Date().toISOString() });
    if (url.pathname !== '/api/sports') return json({ error: 'Not found' }, 404);

    const cache = caches.default;
    const cacheKey = new Request(`${url.origin}/api/sports?v=6`, request);
    const cached = await cache.match(cacheKey);
    if (cached) return withCors(cached);

    try {
      const payload = await buildPayload(env);
      const response = json(payload, 200, {
        'Cache-Control': 'public, max-age=45, s-maxage=45, stale-while-revalidate=180',
        'X-VaryCave-Source': payload.meta.source
      });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (error) {
      return json({ error: 'Live aggregation failed', detail: String(error?.message || error) }, 502);
    }
  }
};

async function buildPayload(env) {
  const now = new Date();
  const dateRange = scoreboardRange(now);
  const scoreboards = await Promise.all(
    Object.entries(LEAGUES).map(async ([league, spec]) => {
      const url = `${ESPN_BASE}/${spec.path}/scoreboard?limit=100&dates=${dateRange}`;
      try {
        const data = await fetchJson(url, 7000);
        return [league, normalizeScoreboard(league, data)];
      } catch (error) {
        return [league, []];
      }
    })
  );

  const eventsByLeague = Object.fromEntries(scoreboards);
  let events = Object.values(eventsByLeague).flat();
  const odds = env.ODDS_API_KEY ? await fetchOdds(env.ODDS_API_KEY).catch(() => new Map()) : new Map();
  events = events.map(event => ({ ...event, odds: odds.get(oddsKey(event)) || event.odds }));

  const stories = await fetchStories().catch(() => []);
  const top25 = await fetchTop25().catch(() => []);
  const leaguePages = Object.keys(LEAGUES).map(league => buildLeaguePage(league, eventsByLeague[league] || [], stories));
  const michigan = buildMichigan(events.filter(e => e.league === 'NCAAF'));
  const alerts = buildAlerts(events);

  return {
    meta: {
      source: 'LIVE',
      generatedAt: now.toISOString(),
      timeZone: 'America/Chicago',
      odds: env.ODDS_API_KEY ? 'LIVE' : 'UNAVAILABLE',
      providers: ['ESPN scoreboard feeds', ...(env.ODDS_API_KEY ? ['The Odds API'] : []), 'ESPN RSS']
    },
    events,
    tickerLanes: Object.keys(LEAGUES).map((league, index) => ({ league, direction: TICKER_DIRECTIONS[index] })),
    leaguePages,
    top25: top25.slice(0, 25),
    top25Games: rankedGames(events, top25),
    michigan,
    stories: stories.slice(0, 12).map(s => [s.league, s.title, s.summary || s.title]),
    alerts
  };
}

function normalizeScoreboard(league, data) {
  return (data?.events || []).map(raw => {
    const competition = raw.competitions?.[0] || {};
    const competitors = competition.competitors || [];
    const away = competitors.find(c => c.homeAway === 'away') || competitors[0] || {};
    const home = competitors.find(c => c.homeAway === 'home') || competitors[1] || {};
    const status = competition.status || raw.status || {};
    const state = status.type?.state || 'pre';
    const shortDetail = status.type?.shortDetail || status.type?.description || 'UPCOMING';
    const isRace = league === 'F1' || league === 'INDYCAR';

    if (isRace) {
      const leader = competitors[0] || {};
      const second = competitors[1] || {};
      return {
        id: `${league}-${raw.id}`,
        providerId: raw.id,
        league,
        status: shortDetail.toUpperCase(),
        title: raw.name || raw.shortName || league,
        away: abbreviation(leader),
        awayName: displayName(leader),
        home: abbreviation(second) || 'FIELD',
        homeName: displayName(second) || 'FIELD',
        start: raw.date,
        venue: competition.venue?.fullName || raw.name || league,
        network: broadcast(competition),
        score: state === 'in' ? shortDetail : undefined,
        detail: status.type?.detail || shortDetail,
        state,
        logos: { away: logoUrl(leader), home: logoUrl(second) }
      };
    }

    return {
      id: `${league}-${raw.id}`,
      providerId: raw.id,
      league,
      status: shortDetail.toUpperCase(),
      title: raw.name || raw.shortName || `${displayName(away)} at ${displayName(home)}`,
      away: abbreviation(away),
      awayName: displayName(away),
      home: abbreviation(home),
      homeName: displayName(home),
      start: raw.date,
      venue: competition.venue?.fullName || 'VENUE TBA',
      network: broadcast(competition),
      score: state !== 'pre' ? `${away.score || 0} — ${home.score || 0}` : undefined,
      detail: status.type?.detail || shortDetail,
      state,
      rankings: {
        away: away.curatedRank?.current || null,
        home: home.curatedRank?.current || null
      },
      logos: { away: logoUrl(away), home: logoUrl(home) }
    };
  }).filter(e => e.away || e.home);
}

function buildLeaguePage(league, events, stories) {
  const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
  const results = sorted.filter(e => e.state === 'post').slice(-5).reverse().map(toDeskRow);
  const upcoming = sorted.filter(e => e.state === 'pre').slice(0, 8).map(toDeskRow);
  const live = sorted.filter(e => e.state === 'in');
  const leadEvent = live[0] || upcomingEvent(sorted) || sorted[0];
  const story = stories.find(s => s.league === league);
  const lead = leadEvent ? {
    away: leadEvent.away,
    home: leadEvent.home,
    label: leadEvent.status,
    time: leadEvent.score || centralTime(leadEvent.start),
    odds: oddsSummary(leadEvent.odds)
  } : { away: league, home: 'TODAY', label: 'NO EVENT LOADED', time: 'CHECK BACK', odds: '' };

  return {
    league,
    headline: story?.title || `${league} LIVE COMMAND BOARD`,
    summary: story?.summary || 'Live scores, the current slate, results and marquee events update through the VaryCave gateway.',
    lead,
    results,
    upcoming,
    marquee: [...live, ...sorted.filter(e => e.state === 'pre')].slice(0, 5).map(e => ({
      away: e.away,
      home: e.home,
      detail: e.state === 'in' ? `${e.status} · ${e.score}` : `${centralTime(e.start)} · ${e.network}`
    }))
  };
}

function buildMichigan(events) {
  const games = events.filter(e => ['MICH', 'MICHIGAN'].includes(e.away) || ['MICH', 'MICHIGAN'].includes(e.home));
  const upcoming = games.filter(e => e.state === 'pre').sort((a, b) => new Date(a.start) - new Date(b.start));
  const next = upcoming[0];
  return {
    team: 'MICHIGAN WOLVERINES',
    record: 'LIVE FEED',
    ranking: next?.rankings?.away || next?.rankings?.home ? `AP #${next.rankings.away || next.rankings.home}` : 'AP RANKING',
    conference: 'BIG TEN',
    nextGame: {
      opponent: next ? (next.away === 'MICH' ? next.homeName : next.awayName) : 'TBA',
      start: next?.start || new Date(Date.now() + 86400000).toISOString(),
      network: next?.network || 'TBA',
      venue: next?.venue || 'TBA'
    },
    schedule: upcoming.slice(0, 6).map(e => ({
      opponent: e.away === 'MICH' ? e.homeName : e.awayName,
      start: e.start,
      site: e.home === 'MICH' ? 'HOME' : 'AWAY'
    })),
    notes: ['Schedule supplied by the live gateway', 'All times display in Dallas Central Time', 'Live scores take priority during Michigan games']
  };
}

function buildAlerts(events) {
  return events.filter(e => e.state === 'in').map(e => {
    const scores = String(e.score || '').match(/\d+/g)?.map(Number) || [];
    const close = scores.length >= 2 && Math.abs(scores[0] - scores[1]) <= 7;
    return {
      league: e.league,
      type: close ? 'CLOSE GAME' : 'LIVE UPDATE',
      title: `${e.away} ${e.score || ''} ${e.home}`.trim(),
      detail: `${e.status} · ${e.network}`,
      priority: close ? 100 : 60
    };
  }).sort((a, b) => b.priority - a.priority).slice(0, 5);
}

async function fetchTop25() {
  const data = await fetchJson(`${ESPN_BASE}/football/college-football/rankings`, 7000);
  const poll = (data?.rankings || []).find(r => /AP Top 25/i.test(r.name || '')) || data?.rankings?.[0];
  return (poll?.ranks || []).map(item => ({
    rank: item.current,
    team: item.team?.nickname || item.team?.displayName || item.team?.name,
    code: item.team?.abbreviation,
    record: item.recordSummary || '',
    move: item.previous ? signed(item.previous - item.current) : '—',
    logo: item.team?.logos?.[0]?.href
  }));
}

async function fetchStories() {
  const results = await Promise.all(NEWS_FEEDS.map(async ([league, url]) => {
    try {
      const xml = await fetchText(url, 6000);
      return parseRss(xml).slice(0, 4).map(item => ({ league, ...item }));
    } catch (_) {
      return [];
    }
  }));
  return results.flat().sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
}

async function fetchOdds(apiKey) {
  const sportKeys = {
    NFL: 'americanfootball_nfl', NCAAF: 'americanfootball_ncaaf', NBA: 'basketball_nba',
    MLB: 'baseball_mlb', NHL: 'icehockey_nhl'
  };
  const map = new Map();
  await Promise.all(Object.entries(sportKeys).map(async ([league, sport]) => {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${encodeURIComponent(apiKey)}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
    const games = await fetchJson(url, 7000);
    for (const game of games || []) {
      const bookmaker = game.bookmakers?.[0];
      if (!bookmaker) continue;
      const markets = Object.fromEntries(bookmaker.markets.map(m => [m.key, m.outcomes]));
      const away = shortTeam(game.away_team);
      const home = shortTeam(game.home_team);
      map.set(`${league}:${away}:${home}`, {
        spread: marketText(markets.spreads, 'point'),
        moneyline: marketText(markets.h2h, 'price'),
        total: totalText(markets.totals),
        book: bookmaker.title,
        updatedAt: bookmaker.last_update
      });
    }
  }));
  return map;
}

function rankedGames(events, top25) {
  const ranks = new Map(top25.map(t => [t.code, t.rank]));
  return events.filter(e => e.league === 'NCAAF' && (ranks.has(e.away) || ranks.has(e.home))).slice(0, 8).map(e => ({
    away: e.away,
    home: e.home,
    time: `${centralTime(e.start)} · ${e.network}`,
    note: `${ranks.has(e.away) ? `#${ranks.get(e.away)} ` : ''}${e.away} at ${ranks.has(e.home) ? `#${ranks.get(e.home)} ` : ''}${e.home}`
  }));
}

function toDeskRow(e) {
  return { away: e.away, home: e.home, score: e.score, detail: e.state === 'pre' ? `${centralTime(e.start)} · ${e.network}` : e.status, odds: oddsSummary(e.odds) };
}
function upcomingEvent(events) { return events.find(e => e.state === 'pre'); }
function abbreviation(c) { return c?.team?.abbreviation || c?.athlete?.shortName || c?.athlete?.displayName?.split(' ').pop()?.slice(0, 3)?.toUpperCase() || ''; }
function displayName(c) { return c?.team?.nickname || c?.team?.displayName || c?.athlete?.displayName || ''; }
function logoUrl(c) { return c?.team?.logo || c?.team?.logos?.[0]?.href || c?.athlete?.headshot?.href || ''; }
function broadcast(c) { return c?.broadcasts?.flatMap(b => b.names || [b.name]).filter(Boolean).join(' / ') || 'STREAM'; }
function oddsKey(e) { return `${e.league}:${e.away}:${e.home}`; }
function shortTeam(name = '') { return name.split(/\s+/).pop().replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase(); }
function oddsSummary(o) { return o ? [o.spread, o.moneyline, o.total].filter(Boolean).join(' · ') : 'ODDS N/A'; }
function signed(n) { return n > 0 ? `+${n}` : n < 0 ? String(n) : '—'; }
function centralTime(iso) { return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) + ' CT'; }
function scoreboardRange(now) { const a = new Date(now.getTime() - 3 * 86400000); const b = new Date(now.getTime() + 8 * 86400000); return `${ymd(a)}-${ymd(b)}`; }
function ymd(d) { return d.toISOString().slice(0, 10).replaceAll('-', ''); }
function marketText(outcomes = [], field) { return outcomes.slice(0, 2).map(o => `${shortTeam(o.name)} ${o[field] > 0 ? '+' : ''}${o[field]}`).join(' · '); }
function totalText(outcomes = []) { return outcomes.slice(0, 2).map(o => `${o.name === 'Over' ? 'O' : 'U'} ${o.point}`).join(' / '); }

function parseRss(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match => {
    const item = match[1];
    return {
      title: decodeXml(tag(item, 'title')),
      summary: stripHtml(decodeXml(tag(item, 'description'))).slice(0, 220),
      link: decodeXml(tag(item, 'link')),
      publishedAt: tag(item, 'pubDate')
    };
  }).filter(x => x.title);
}
function tag(xml, name) { return (xml.match(new RegExp(`<${name}(?:[^>]*)>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`, 'i')) || [])[1] || ''; }
function stripHtml(value) { return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function decodeXml(value) { return value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').trim(); }

async function fetchJson(url, timeout) { const response = await timedFetch(url, timeout); if (!response.ok) throw new Error(`${response.status} ${url}`); return response.json(); }
async function fetchText(url, timeout) { const response = await timedFetch(url, timeout); if (!response.ok) throw new Error(`${response.status} ${url}`); return response.text(); }
async function timedFetch(url, timeout) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout); try { return await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'VaryCave-SportsCenter/6.0' } }); } finally { clearTimeout(timer); } }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }
function withCors(response) { const headers = new Headers(response.headers); Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v)); return new Response(response.body, { status: response.status, headers }); }
function json(body, status = 200, extra = {}) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(), ...extra } }); }
