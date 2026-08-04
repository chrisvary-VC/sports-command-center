(() => {
  const config = window.DASHBOARD_CONFIG || {};
  const endpoint = config.data?.endpoint;
  const refreshMs = config.data?.refreshMs || 60000;
  const stateOf = event => /FINAL|FT/i.test(event.status || '') ? 'final' : /LIVE|TOP|BOT|Q[1-4]|HALF|LAP/i.test(event.status || '') ? 'live' : 'upcoming';
  const lineFor = event => [event.odds?.spread, event.odds?.moneyline, event.odds?.total].filter(Boolean).join(' · ');

  function buildLeaguePages(events) {
    return [...new Set(events.map(event => event.league))].map(league => {
      const games = events.filter(event => event.league === league);
      const lead = games.find(event => stateOf(event) === 'live') || games.find(event => stateOf(event) === 'upcoming') || games[0];
      const results = games.filter(event => stateOf(event) === 'final').slice(0, 3).map(event => ({ away: event.away, home: event.home, score: event.score || event.detail, detail: event.status }));
      const upcoming = games.filter(event => stateOf(event) !== 'final').slice(0, 3).map(event => ({ away: event.away, home: event.home, detail: event.detail || event.status, odds: lineFor(event) }));
      return {
        league,
        headline: `${league} LIVE LEAGUE BOARD`,
        summary: `${games.length} games currently supplied by the live scoreboard feed.`,
        lead: { away: lead.away, home: lead.home, label: lead.status, time: lead.score || lead.detail || lead.status, odds: lineFor(lead) },
        results,
        upcoming,
        marquee: upcoming.map(game => ({ away: game.away, home: game.home, detail: game.detail }))
      };
    });
  }

  function normalize(payload) {
    const events = Array.isArray(payload.events) ? payload.events : [];
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
      stories: [],
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
    window.SPORTS_DATA = normalize(await response.json());
    window.VARYCAVE_DATA_SOURCE = 'LIVE';
    return window.SPORTS_DATA;
  }

  window.SPORTS_DATA = {
    events: [], tickerLanes: [], leaguePages: [], stories: [], top25: [], top25Games: [],
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
