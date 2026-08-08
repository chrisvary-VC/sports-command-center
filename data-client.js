(() => {
  const config = window.DASHBOARD_CONFIG || {};
  const fallbackStories = Array.isArray(window.SPORTS_DATA?.stories) ? window.SPORTS_DATA.stories : [];
  const endpoint = config.data?.endpoint;
  const refreshMs = config.data?.refreshMs || 60000;
  const stateOf = event => /FINAL|FT/i.test(event.status || '') ? 'final' : /LIVE|TOP|BOT|Q[1-4]|HALF|LAP/i.test(event.status || '') ? 'live' : 'upcoming';
  const lineFor = event => [event.odds?.spread, event.odds?.moneyline, event.odds?.total].filter(Boolean).join(' · ');

  function buildLeaguePages(events) {
    return [...new Set(events.map(event => event.league))].map(league => {
      const games = events.filter(event => event.league === league);
      const lead = games.find(event => stateOf(event) === 'live') || games.find(event => stateOf(event) === 'upcoming') || games[0];
      const isRacing = ['F1', 'INDYCAR'].includes(league);
      const results = games.filter(event => stateOf(event) === 'final').slice(0, 3).map(event => ({ away: event.away, awayLogo: event.awayLogo, awayStanding:event.awayStanding, home: event.home, homeLogo: event.homeLogo, homeStanding:event.homeStanding, score: event.score || event.detail, detail: event.status }));
      const upcoming = games.filter(event => stateOf(event) !== 'final').slice(0, 3).map(event => ({ away: event.away, awayLogo: event.awayLogo, awayStanding:event.awayStanding, home: event.home, homeLogo: event.homeLogo, homeStanding:event.homeStanding, detail: event.detail || event.status, odds: lineFor(event) }));
      return {
        league,
        headline: isRacing ? `RACE CONTROL · ${lead.eventName || league}` : `${league} LIVE LEAGUE BOARD`,
        summary: isRacing ? `${games.length} timed sessions tracked across the next race weekend.` : `${games.length} games currently supplied by the live scoreboard feed.`,
        lead: { away: lead.away, home: lead.home, label: lead.status, time: lead.score || lead.detail || lead.status, odds: lineFor(lead) },
        results,
        upcoming,
        marquee: upcoming.map(game => ({ away: game.away, home: game.home, detail: game.detail }))
      };
    });
  }

  function normalize(payload) {
    const standings = payload.standings || {};
    const events = Array.isArray(payload.events) ? payload.events.map(event => ({
      ...event,
      awayStanding: standings[event.league]?.[event.away] || null,
      homeStanding: standings[event.league]?.[event.home] || null
    })) : [];
    if (!events.length) throw new Error('The live sports feed returned no events');
    const availableLeagues = new Set(events.map(event => event.league));
    config.enabledSports = (config.enabledSports || []).filter(league => availableLeagues.has(league));
    const michiganGames = events.filter(event => event.league === 'NCAAF' && [event.away, event.home].includes('MICH'));
    const nextMichigan = michiganGames.find(event => stateOf(event) !== 'final') || michiganGames[0];
    return {
      ...payload,
      events,
      tickerLanes: payload.tickerLanes || [...new Set(events.map(event => event.league))].map((league, index) => ({ league, direction: index % 2 ? 'right' : 'left' })),
      leaguePages: buildLeaguePages(events),
      stories: ((payload.news || []).length ? payload.news : fallbackStories).slice(0, 8),
      top25: [],
      top25Games: [],
      michigan: {
        team: 'MICHIGAN WOLVERINES', record: 'LIVE FEED', ranking: 'RANKING NOT PROVIDED', conference: 'BIG TEN',
        nextGame: { opponent: nextMichigan ? (nextMichigan.away === 'MICH' ? nextMichigan.homeName : nextMichigan.awayName) : 'SCHEDULE UNAVAILABLE', start: nextMichigan?.start || new Date().toISOString(), network: nextMichigan?.network || '', venue: nextMichigan?.venue || '' },
        schedule: michiganGames.filter(event => stateOf(event) !== 'final').slice(0, 3).map(event => ({ opponent: event.away === 'MICH' ? event.homeName : event.awayName, start: event.start, site: event.home === 'MICH' ? 'HOME' : 'AWAY' })),
        notes: ['Schedule information is supplied by the live scoreboard feed.']
      }
    };
  }

  function setStatus(label) {
    const status = document.getElementById('dataStatus');
    if (status) status.textContent = `${label} · CT`;
  }

  async function load() {
    if (config.data?.mode !== 'live' || !endpoint) throw new Error('Live sports endpoint is not configured');
    const response = await fetch(`${endpoint}?display=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Sports gateway returned ${response.status}`);
    const payload = await response.json();
    const [editorial, standings] = await Promise.all([
      (payload.news || []).length ? Promise.resolve(payload.news) : loadEditorial(),
      loadStandings()
    ]);
    payload.news = editorial;
    payload.standings = standings;
    window.SPORTS_DATA = normalize(payload);
    window.VARYCAVE_DATA_SOURCE = 'LIVE';
    return window.SPORTS_DATA;
  }

  async function loadStandings() {
    const feeds = [
      ['NFL', 'football/nfl'], ['NBA', 'basketball/nba'],
      ['MLB', 'baseball/mlb'], ['NHL', 'hockey/nhl']
    ];
    const output = {};
    const results = await Promise.allSettled(feeds.map(async ([league, path]) => {
      const response = await fetch(`https://site.api.espn.com/apis/v2/sports/${path}/standings`, { cache: 'no-store' });
      if (!response.ok) return [league, {}];
      const payload = await response.json();
      const teams = {};
      const visit = group => {
        (group.standings?.entries || []).forEach((entry, index) => {
          const stats = Object.fromEntries((entry.stats || []).map(stat => [stat.name, stat]));
          const seed = Number(stats.playoffSeed?.value) > 0 ? Number(stats.playoffSeed.value) : index + 1;
          const groupName = group.abbreviation || group.shortName || group.name || 'LEAGUE';
          const wins = stats.wins?.displayValue;
          const losses = stats.losses?.displayValue;
          teams[entry.team.abbreviation] = {
            rank: seed,
            label: `#${seed} ${groupName}`,
            record: wins != null && losses != null ? `${wins}-${losses}` : (stats.overall?.displayValue || '')
          };
        });
        (group.children || []).forEach(visit);
      };
      (payload.children || []).forEach(visit);
      return [league, teams];
    }));
    results.forEach(result => { if (result.status === 'fulfilled') output[result.value[0]] = result.value[1]; });

    try {
      const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings', { cache: 'no-store' });
      const payload = response.ok ? await response.json() : {};
      output.NCAAF = {};
      (payload.rankings?.[0]?.ranks || []).forEach(entry => {
        output.NCAAF[entry.team.abbreviation] = { rank: entry.current, label: `AP #${entry.current}`, record: entry.recordSummary || '' };
      });
    } catch (error) {
      output.NCAAF = {};
    }
    return output;
  }

  async function loadEditorial() {
    const feeds = [
      ['NFL', 'football/nfl'], ['NBA', 'basketball/nba'], ['MLB', 'baseball/mlb'],
      ['NHL', 'hockey/nhl'], ['NCAAF', 'football/college-football'], ['F1', 'racing/f1']
    ];
    const results = await Promise.allSettled(feeds.map(async ([league, path]) => {
      const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/news?limit=2`, { cache: 'no-store' });
      if (!response.ok) return [];
      const payload = await response.json();
      return (payload.articles || []).map(article => ({
        id: article.id || article.links?.web?.href,
        league,
        headline: article.headline || article.title,
        description: article.description || '',
        image: article.images?.[0]?.url || '',
        url: article.links?.web?.href || '',
        byline: article.byline || 'ESPN',
        published: article.published || article.lastModified || null
      })).filter(article => article.headline);
    }));
    return results.flatMap(result => result.status === 'fulfilled' ? result.value : []).slice(0, 8);
  }

  window.SPORTS_DATA = {
    events: [], bookmakerEvents: [], tickerLanes: [], leaguePages: [], stories: [], top25: [], top25Games: [],
    michigan: {
      team: 'MICHIGAN WOLVERINES', record: 'FEED OFFLINE', ranking: '', conference: 'BIG TEN',
      nextGame: { opponent: 'UNAVAILABLE', start: new Date().toISOString(), network: '', venue: '' },
      schedule: [], notes: ['Live schedule temporarily unavailable.']
    }
  };
  window.SPORTS_DATA_READY = load().then(data => {
    setStatus('LIVE DATA');
    if (!data.top25.length && document.querySelector('.top25-block')) document.querySelector('.top25-block').hidden = true;
    if (!data.events.some(event => event.league === 'NCAAF' && [event.away, event.home].includes('MICH')) && document.querySelector('.michigan-block')) document.querySelector('.michigan-block').hidden = true;
    document.querySelector('.story-card')?.closest('.section-block')?.remove();
    setInterval(async () => {
      try {
        const refreshed = await load();
        setStatus('LIVE DATA');
        window.dispatchEvent(new CustomEvent('varycave:data', { detail: refreshed }));
      } catch (error) {
        console.warn('[VaryCave] Refresh failed; keeping the last live scoreboard.', error);
        setStatus('STALE DATA');
      }
    }, refreshMs);
    return data;
  }).catch(error => {
    console.error('[VaryCave] Live data unavailable.', error);
    window.VARYCAVE_DATA_SOURCE = 'OFFLINE';
    setStatus('LIVE FEED OFFLINE');
    document.documentElement.classList.add('data-offline');
    return window.SPORTS_DATA;
  });
})();
