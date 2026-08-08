(() => {
  let data = window.SPORTS_DATA || {};
  const config = window.DASHBOARD_CONFIG || {};
  const assets = window.SPORTS_ASSETS || {};
  const dashboard = document.getElementById('dashboard');
  const tz = config.timeZone || 'America/Chicago';
  const zone = config.timeZoneLabel || 'CT';
  const sports = config.enabledSports || [];
  const favoriteCodes = Object.values(config.favorites || {}).flat();
  const leagueNames = {ALL:'All Sports', NFL:'NFL', NBA:'NBA', MLB:'MLB', NHL:'NHL', NCAAF:'NCAA', F1:'Formula 1', INDYCAR:'IndyCar'};
  const leagueLogos = {
    ALL:'assets/varycave-glass-vc.png',
    NFL:'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
    NBA:'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
    MLB:'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
    NHL:'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
    NCAAF:'https://a.espncdn.com/i/espn/misc_logos/500/ncaa.png',
    F1:'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png',
    INDYCAR:'https://a.espncdn.com/i/teamlogos/leagues/500/irl.png'
  };
  let selectedLeague = 'ALL';
  let leagueRotationIndex = -1;
  let rotationPausedUntil = 0;
  let scoreboardPage = 0;
  let storyPage = 0;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const logo = (code, suppliedUrl) => suppliedUrl || assets.logos?.[code]
    ? `<img src="${esc(suppliedUrl || assets.logos[code])}" alt="${esc(code)} logo">`
    : `<span>${esc(code)}</span>`;
  const isLive = event => /LIVE|TOP|BOT|Q[1-4]|HALF|OT|LAP/i.test(`${event.status} ${event.detail || ''}`);
  const isFinal = event => /FINAL/i.test(event.status || '');
  const isFavorite = event => favoriteCodes.includes(event.away) || favoriteCodes.includes(event.home);
  const eventDate = event => new Date(event.start);
  const dateTime = event => new Intl.DateTimeFormat('en-US', {timeZone:tz, weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}).format(eventDate(event));
  const shortTime = event => new Intl.DateTimeFormat('en-US', {timeZone:tz, hour:'numeric', minute:'2-digit'}).format(eventDate(event));
  const standing = value => value ? `${value.label}${value.record ? ` · ${value.record}` : ''}` : '';
  const source = window.VARYCAVE_DATA_SOURCE || 'DEMO';

  function reasonFor(event) {
    if (isFavorite(event)) return 'FOLLOWING';
    if (isLive(event) && event.score) return 'LIVE ACTION';
    if (event.league === 'NCAAF') return 'RANKED STAKES';
    if (event.league === 'F1' || event.league === 'INDYCAR') return 'RACE WEEK';
    return event.network ? 'NATIONAL WINDOW' : 'UP NEXT';
  }

  function contextFor(event) {
    if (isLive(event)) return `${event.detail || event.status}. Follow the game state without leaving the board.`;
    if (isFavorite(event)) return `${event.awayName || event.away} and ${event.homeName || event.home} are elevated because they match your followed teams.`;
    if (event.league === 'NCAAF') return 'A ranked matchup with national implications and a place on your watchlist.';
    if (event.league === 'F1' || event.league === 'INDYCAR') return 'The next major race window, with the leading contenders and broadcast details in one place.';
    return `${event.network || 'Broadcast details pending'} carries the next notable ${leagueNames[event.league] || event.league} matchup.`;
  }

  function sortedEvents(filter = selectedLeague) {
    return (data.events || [])
      .filter(event => filter === 'ALL' || event.league === filter)
      .sort((a, b) => {
        const urgency = event => (isLive(event) ? 0 : isFavorite(event) ? 1 : isFinal(event) ? 3 : 2);
        return urgency(a) - urgency(b) || eventDate(a) - eventDate(b);
      });
  }

  function balancedScoreEvents(events, limit = 4) {
    const orderedLeagues = [selectedLeague, ...sports].filter((league, index, list) => league !== 'ALL' && list.indexOf(league) === index);
    const picks = [];
    orderedLeagues.forEach(league => {
      const event = events.find(item => item.league === league && !isFinal(item)) || events.find(item => item.league === league);
      if (event && !picks.includes(event)) picks.push(event);
    });
    return picks.slice(0, limit);
  }

  function pagedScoreboardEvents(events, liveEvents, limit = 4) {
    if (!liveEvents.length) return { events: balancedScoreEvents(events, limit), pages: 1 };
    const pages = Math.max(1, Math.ceil(liveEvents.length / limit));
    scoreboardPage %= pages;
    const pageEvents = liveEvents.slice(scoreboardPage * limit, scoreboardPage * limit + limit);
    if (pageEvents.length < limit) {
      const fillers = balancedScoreEvents(events.filter(event => !liveEvents.includes(event)), limit - pageEvents.length);
      pageEvents.push(...fillers);
    }
    return { events: pageEvents, pages };
  }

  function scoreCard(event) {
    const status = isLive(event) ? event.detail || event.status : isFinal(event) ? 'FINAL' : `${shortTime(event)} ${zone}`;
    return `<article class="score-card ${isLive(event) ? 'is-live' : ''}">
      <div class="score-card-top"><span>${esc(leagueNames[event.league] || event.league)}</span><b>${esc(reasonFor(event))}</b></div>
      <div class="score-card-match">
        <div class="score-team"><i>${logo(event.away, event.awayLogo)}</i><span><strong>${esc(event.away)}</strong>${event.awayStanding ? `<small>${esc(standing(event.awayStanding))}</small>` : ''}</span></div>
        <em>${esc(event.score || 'VS')}</em>
        <div class="score-team"><i>${logo(event.home, event.homeLogo)}</i><span><strong>${esc(event.home)}</strong>${event.homeStanding ? `<small>${esc(standing(event.homeStanding))}</small>` : ''}</span></div>
      </div>
      <div class="score-card-meta"><strong>${esc(status)}</strong><span>${esc(event.network || '')}</span></div>
    </article>`;
  }

  function featured(event) {
    if (!event) return `<article class="feature-card empty-state"><h2>No featured event</h2><p>Choose another league to see the next available matchup.</p></article>`;
    const gameStatus = isLive(event) ? event.detail || event.status : event.status || 'UPCOMING';
    return `<article class="feature-card">
      <div class="feature-art" style="background-image:linear-gradient(90deg,rgba(6,17,30,.98),rgba(6,17,30,.78),rgba(6,17,30,.35)),url('${esc(assets.eventImages?.[event.id] || assets.heroImages?.[event.league] || '')}')"></div>
      <div class="feature-watermarks"><i>${logo(event.away, event.awayLogo)}</i><i>${logo(event.home, event.homeLogo)}</i></div>
      <div class="feature-content">
        <div class="eyebrow"><span class="live-pill">${esc(isLive(event) ? event.status : leagueNames[event.league] || event.league)}</span><span>${esc(reasonFor(event))}</span></div>
        <p class="feature-label">VARYCAVE HERO EVENT</p>
        <h1>${esc(event.awayName || event.away)} <span>vs</span> ${esc(event.homeName || event.home)}</h1>
        <div class="feature-matchup">
          <div class="feature-team">${logo(event.away, event.awayLogo)}<span><strong>${esc(event.away)}</strong><small>${esc(event.awayStanding ? standing(event.awayStanding) : event.awayName || 'AWAY')}</small></span></div>
          <div class="feature-score"><small>${esc(isLive(event) ? gameStatus : 'STARTS')}</small><b>${esc(event.score || `${shortTime(event)} ${zone}`)}</b></div>
          <div class="feature-team feature-team-home">${logo(event.home, event.homeLogo)}<span><strong>${esc(event.home)}</strong><small>${esc(event.homeStanding ? standing(event.homeStanding) : event.homeName || 'HOME')}</small></span></div>
        </div>
        <div class="feature-facts">
          <span><small>STATUS</small><strong>${esc(gameStatus)}</strong><em>${esc(dateTime(event))} ${zone}</em></span>
          <span><small>WATCH</small><strong>${esc(event.network || 'TBD')}</strong><em>${event.network ? 'Broadcast coverage' : 'Network pending'}</em></span>
          <span><small>VENUE</small><strong>${esc(event.venue || 'TBD')}</strong><em>${esc(leagueNames[event.league] || event.league)} event</em></span>
        </div>
        <div class="feature-odds"><span><small>SPREAD</small><b>${esc(event.odds?.spread || 'Not offered')}</b></span><span><small>MONEYLINE</small><b>${esc(event.odds?.moneyline || 'Not offered')}</b></span><span><small>OVER / UNDER</small><b>${esc(event.odds?.total || 'Not offered')}</b></span></div>
      </div>
    </article>`;
  }

  function watchRow(event) {
    return `<article class="watch-row">
      <time>${esc(isLive(event) ? 'LIVE' : shortTime(event))}<small>${isLive(event) ? esc(event.detail || event.status) : zone}</small></time>
      <div class="watch-match"><strong>${esc(event.away)} <span>vs</span> ${esc(event.home)}</strong><small>${esc(dateTime(event))}</small></div>
      <div class="watch-network"><b>${esc(reasonFor(event))}</b><span>${esc(event.network || 'TBD')}</span></div>
    </article>`;
  }

  function marketBoard(events, bookmakerEvents = []) {
    const allowedMarkets = bookmakerEvents.filter(event => ['NFL','NCAAF','MLB','NBA'].includes(event.league));
    if (allowedMarkets.length) {
      const marketNames = { h2h: 'MONEYLINE', spreads: 'SPREAD', totals: 'TOTAL' };
      const rows = allowedMarkets.flatMap(event => event.bookmakers.slice(0, 3).map(bookmaker => {
        const markets = bookmaker.markets.map(market => {
          const outcomes = market.outcomes.map(outcome => `${outcome.name} ${outcome.point == null ? '' : `${outcome.point} `}${Number(outcome.price) > 0 ? '+' : ''}${outcome.price}`).join(' · ');
          return `<span><small>${esc(marketNames[market.key] || market.key)}</small><b>${esc(outcomes)}</b></span>`;
        }).join('');
        return `<article class="market-row bookmaker"><header><b>${esc(leagueNames[event.league] || event.league)}</b><span>${esc(bookmaker.title)} · ${esc(shortTime(event))} ${zone}</span></header><strong>${esc(event.awayName)} <i>vs</i> ${esc(event.homeName)}</strong><div>${markets}</div></article>`;
      })).slice(0, 24).join('');
      const bookCount = new Set(allowedMarkets.flatMap(event => event.bookmakers.map(book => book.key))).size;
      return `<aside class="market-panel"><header><div><p>FOOTBALL · BASEBALL · BASKETBALL</p><h2>Market wire</h2></div><span>${allowedMarkets.length} EVENTS · ${bookCount} BOOKS</span></header><div class="market-window"><div class="market-track">${rows}${rows}</div></div><footer><span>SPREADS · TOTALS · MONEYLINES</span><b>THE ODDS API</b></footer></aside>`;
    }
    const marketEvents = events.filter(event => ['NFL','NCAAF','MLB','NBA'].includes(event.league) && event.odds && [event.odds.spread,event.odds.moneyline,event.odds.total].some(Boolean));
    const rows = marketEvents.map((event, index) => {
      const markets = [
        event.odds.spread ? `<span><small>LINE</small><b>${esc(event.odds.spread)}</b></span>` : '',
        event.odds.total ? `<span><small>TOTAL</small><b>${esc(event.odds.total)}</b></span>` : '',
        event.odds.moneyline ? `<span><small>MONEYLINE</small><b>${esc(event.odds.moneyline)}</b></span>` : ''
      ].join('');
      return `<article class="market-row"><header><b>${esc(leagueNames[event.league] || event.league)}</b><span>#${String(index + 1).padStart(3,'0')} · ${esc(shortTime(event))} ${zone}</span></header><strong>${esc(event.away)} <i>vs</i> ${esc(event.home)}</strong><div>${markets}</div></article>`;
    }).join('');
    return `<aside class="market-panel"><header><div><p>PUBLIC LINE FEED</p><h2>Market wire</h2></div><span>${marketEvents.length} EVENTS</span></header>${rows ? `<div class="market-window"><div class="market-track">${rows}${rows}</div></div>` : '<p class="empty-state">No betting markets are currently supplied.</p>'}<footer><span>SPREADS · TOTALS · MONEYLINES</span><b>BOOKMAKER FEED CONNECTING</b></footer></aside>`;
  }

  function leagueBoard(league) {
    const page = (data.leaguePages || []).find(item => item.league === league) || (data.leaguePages || [])[0];
    if (!page) return '<div class="empty-state">No league detail is available.</div>';
    const boardRanks = game => [game.awayStanding ? `${game.away} ${standing(game.awayStanding)}` : '', game.homeStanding ? `${game.home} ${standing(game.homeStanding)}` : ''].filter(Boolean).join(' · ');
    const resultRows = (page.results || []).map(game => `<div class="board-row"><span>${logo(game.away, game.awayLogo)}</span><strong>${esc(game.away)} <i>vs</i> ${esc(game.home)}</strong><em>${esc(game.score)}</em><small>${esc(boardRanks(game) || game.detail)}</small></div>`).join('');
    const upcomingRows = (page.upcoming || []).map(game => `<div class="board-row"><span>${logo(game.away, game.awayLogo)}</span><strong>${esc(game.away)} <i>vs</i> ${esc(game.home)}</strong><em>${esc(game.odds || '')}</em><small>${esc(boardRanks(game) || game.detail)}</small></div>`).join('');
    return `<section class="section league-section">
      <header class="section-head"><div><p>SELECTED LEAGUE</p><h2>${esc(leagueNames[page.league] || page.league)} Board</h2></div><span>RESULTS · UPCOMING · CONTEXT</span></header>
      <div class="league-summary"><div><b>LEAGUE STORYLINE</b><h3>${esc(page.headline)}</h3><p>${esc(page.summary)}</p></div><div class="stakes"><b>GAME WITH STAKES</b><strong>${esc(page.lead.away)} vs ${esc(page.lead.home)}</strong><span>${esc(page.lead.time)} · ${esc(page.lead.odds)}</span></div></div>
      <div class="board-columns"><div><h3>Latest results</h3>${resultRows}</div><div><h3>Coming up</h3>${upcomingRows}</div></div>
    </section>`;
  }

  function favoritesSection() {
    const favoriteEvents = (data.events || []).filter(isFavorite).slice(0, 3);
    const michigan = data.michigan;
    const cards = favoriteEvents.map(event => { const favoriteIsAway = favoriteCodes.includes(event.away); return `<article class="favorite-card"><div class="favorite-mark">${logo(favoriteIsAway ? event.away : event.home, favoriteIsAway ? event.awayLogo : event.homeLogo)}</div><div><b>FOLLOWING</b><h3>${esc(event.away)} vs ${esc(event.home)}</h3><p>${esc(dateTime(event))} ${zone} · ${esc(event.network || '')}</p><span>${esc(event.status)}</span></div></article>`; });
    if (michigan && !favoriteEvents.some(event => event.away === 'MICH' || event.home === 'MICH')) cards.push(`<article class="favorite-card"><div class="favorite-mark">${logo('MICH')}</div><div><b>AP ${esc(michigan.ranking)}</b><h3>${esc(michigan.team)}</h3><p>Next: ${esc(michigan.nextGame.opponent)} · ${esc(new Intl.DateTimeFormat('en-US',{timeZone:tz,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(michigan.nextGame.start)))} ${zone}</p><span>${esc(michigan.record)} · ${esc(michigan.conference)}</span></div></article>`);
    return `<section class="section"><header class="section-head"><div><p>PERSONALIZED</p><h2>Your Teams</h2></div><span>${esc(favoriteCodes.join(' · '))}</span></header><div class="favorite-grid">${cards.join('') || '<p class="empty-state">Follow teams to put their games here.</p>'}</div></section>`;
  }

  function storiesSection() {
    const stories = (data.stories || []).map(story => Array.isArray(story) ? {league:story[0],headline:story[1],description:story[2]} : story);
    const pages = Math.max(1, Math.ceil(stories.length / 2));
    storyPage %= pages;
    const visible = stories.slice(storyPage * 2, storyPage * 2 + 2);
    const cards = visible.map(story => `<article class="visual-story">${story.image ? `<div class="story-photo" style="background-image:linear-gradient(180deg,transparent,rgba(4,12,20,.82)),url('${esc(story.image)}')"></div>` : '<div class="story-photo story-photo-empty"></div>'}<div class="story-copy"><span>${esc(leagueNames[story.league] || story.league || 'SPORTS')}</span><h3>${esc(story.headline)}</h3><p>${esc(story.description || 'Live sports update.')}</p><small>${esc(story.byline || 'LIVE NEWS FEED')} · ${story.published ? esc(new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',minute:'2-digit'}).format(new Date(story.published))) + ` ${zone}` : 'UPDATED TODAY'}</small></div></article>`).join('');
    return `<section class="section stories-section"><header class="section-head"><div><p>LIVE EDITORIAL</p><h2>Stories & alerts</h2></div><span>${stories.length} STORIES · PAGE ${storyPage + 1}/${pages}</span></header><div class="story-grid">${cards || '<p class="empty-state">No verified stories are available.</p>'}</div></section>`;
  }

  function tickerBand(events) {
    const tickerLeagues = ['NFL','NCAAF','MLB'];
    const lanes = tickerLeagues.map(league => {
      const games = events.filter(event => event.league === league).slice(0, 8);
      if (!games.length) return '';
      const items = games.map(event => `<span><b>${esc(event.away)} ${esc(event.score || 'vs')} ${esc(event.home)}</b><i>${esc(isLive(event) ? event.detail || event.status : `${shortTime(event)} ${zone}`)}</i></span>`).join('');
      return `<div class="ticker-lane"><strong>${esc(leagueNames[league] || league)}</strong><div><div class="ticker-track">${items}${items}</div></div></div>`;
    }).join('');
    return lanes ? `<section class="ticker-band" aria-label="Live sports tickers">${lanes}</section>` : '';
  }

  function render() {
    const filtered = sortedEvents();
    const globalEvents = sortedEvents('ALL');
    const live = globalEvents.filter(isLive);
    const scoreboard = pagedScoreboardEvents(globalEvents, live);
    const scoreEvents = scoreboard.events;
    const filteredLive = filtered.filter(isLive);
    const featureEvent = filteredLive[0] || filtered.find(isFavorite) || filtered[0];
    const watch = globalEvents.filter(event => event !== featureEvent && !isFinal(event)).slice(0, 4);
    const boardLeague = selectedLeague === 'ALL' ? featureEvent?.league || 'NFL' : selectedLeague;
    dashboard.innerHTML = `
      <header class="masthead">
        <div class="brand"><img src="assets/varycave-glass-vc.png" alt="VaryCave VC"><div><strong>VaryCave <span>SportsCenter</span></strong><small id="currentDate">LOADING DATE</small></div></div>
        <div class="system-status"><div><span class="status-dot"></span><b>${esc(source)} DATA</b><small id="freshness">UPDATED NOW</small></div><time id="clock">--:--</time></div>
      </header>
      <nav class="league-nav" aria-label="Sports">${['ALL',...sports].map(sport => {const count=(data.events||[]).filter(e=>(sport==='ALL'||e.league===sport)&&isLive(e)).length;return `<button class="${selectedLeague===sport?'active':''}" data-league="${sport}"><span class="nav-sport"><img src="${esc(leagueLogos[sport] || leagueLogos.ALL)}" alt=""><strong>${esc(leagueNames[sport]||sport)}</strong></span>${count?`<b>${count} LIVE</b>`:'<small>VIEW</small>'}</button>`}).join('')}</nav>
      <section class="command-grid">
        <aside class="scoreboard-panel"><header><div><p>${live.length ? `${live.length} LIVE NOW` : 'AROUND SPORTS'}</p><h2>Scoreboard</h2></div><span>${live.length ? `PAGE ${scoreboardPage + 1} / ${scoreboard.pages}` : 'ALL SPORTS'}</span></header><div class="score-grid">${scoreEvents.map(scoreCard).join('') || '<p class="empty-state">No events available.</p>'}</div></aside>
        ${featured(featureEvent)}
        ${marketBoard(globalEvents, data.bookmakerEvents || [])}
      </section>
      ${tickerBand(globalEvents)}
      <div class="lower-grid">${leagueBoard(boardLeague)}${storiesSection()}</div>
      <footer><span><b>${esc(source)} DATA</b> · ${esc(zone)} · LAST REFRESH <strong id="footerUpdate">NOW</strong></span><span>${esc(config.odds?.disclaimer || 'ODDS INFORMATIONAL ONLY')}</span></footer>`;
    dashboard.querySelectorAll('[data-league]').forEach(button => button.addEventListener('click', () => {
      selectedLeague = button.dataset.league;
      leagueRotationIndex = sports.indexOf(selectedLeague);
      rotationPausedUntil = Date.now() + 30000;
      render();
      updateClock();
    }));
  }

  function updateClock() {
    const now = new Date();
    const clock = document.getElementById('clock');
    const date = document.getElementById('currentDate');
    if (clock) clock.textContent = new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',minute:'2-digit'}).format(now);
    if (date) date.textContent = new Intl.DateTimeFormat('en-US',{timeZone:tz,weekday:'long',month:'short',day:'numeric'}).format(now).toUpperCase() + ` · ${zone}`;
  }

  render();
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(() => {
    const liveCount = sortedEvents('ALL').filter(isLive).length;
    const pages = Math.max(1, Math.ceil(liveCount / 4));
    if (pages <= 1) return;
    scoreboardPage = (scoreboardPage + 1) % pages;
    render();
    updateClock();
  }, 6000);
  setInterval(() => {
    const pages = Math.max(1, Math.ceil((data.stories || []).length / 2));
    if (pages <= 1) return;
    storyPage = (storyPage + 1) % pages;
    render();
    updateClock();
  }, 10000);
  setInterval(() => {
    if (Date.now() < rotationPausedUntil) return;
    const rotatingSports = sports.filter(league => (data.events || []).some(event => event.league === league));
    if (!rotatingSports.length) return;
    leagueRotationIndex = (leagueRotationIndex + 1) % rotatingSports.length;
    selectedLeague = rotatingSports[leagueRotationIndex];
    render();
    updateClock();
  }, 12000);
  window.addEventListener('varycave:data', event => {
    if (!event.detail?.events?.length) return;
    data = event.detail;
    render();
    updateClock();
  });
  requestAnimationFrame(() => document.getElementById('bootScreen')?.classList.add('done'));
  setTimeout(() => document.getElementById('bootScreen')?.remove(), 700);
})();
