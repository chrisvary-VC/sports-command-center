(() => {
  const data = window.SPORTS_DATA || {};
  const config = window.DASHBOARD_CONFIG || {};
  const assets = window.SPORTS_ASSETS || {};
  const dashboard = document.getElementById('dashboard');
  const tz = config.timeZone || 'America/Chicago';
  const zone = config.timeZoneLabel || 'CT';
  const sports = config.enabledSports || [];
  const favoriteCodes = Object.values(config.favorites || {}).flat();
  const leagueNames = {ALL:'All Sports', NFL:'NFL', NBA:'NBA', MLB:'MLB', NHL:'NHL', NCAAF:'College', F1:'Formula 1', INDYCAR:'IndyCar'};
  let selectedLeague = 'ALL';

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const logo = code => assets.logos?.[code]
    ? `<img src="${esc(assets.logos[code])}" alt="${esc(code)} logo">`
    : `<span>${esc(code)}</span>`;
  const isLive = event => /LIVE|TOP|BOT|Q[1-4]|HALF|OT|LAP/i.test(`${event.status} ${event.detail || ''}`);
  const isFinal = event => /FINAL/i.test(event.status || '');
  const isFavorite = event => favoriteCodes.includes(event.away) || favoriteCodes.includes(event.home);
  const eventDate = event => new Date(event.start);
  const dateTime = event => new Intl.DateTimeFormat('en-US', {timeZone:tz, weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}).format(eventDate(event));
  const shortTime = event => new Intl.DateTimeFormat('en-US', {timeZone:tz, hour:'numeric', minute:'2-digit'}).format(eventDate(event));
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

  function scoreCard(event) {
    const status = isLive(event) ? event.detail || event.status : isFinal(event) ? 'FINAL' : `${shortTime(event)} ${zone}`;
    return `<article class="score-card ${isLive(event) ? 'is-live' : ''}">
      <div class="score-card-top"><span>${esc(event.league)}</span><b>${esc(reasonFor(event))}</b></div>
      <div class="score-card-match">
        <div class="score-team"><i>${logo(event.away)}</i><strong>${esc(event.away)}</strong></div>
        <em>${esc(event.score || 'VS')}</em>
        <div class="score-team"><i>${logo(event.home)}</i><strong>${esc(event.home)}</strong></div>
      </div>
      <div class="score-card-meta"><strong>${esc(status)}</strong><span>${esc(event.network || '')}</span></div>
    </article>`;
  }

  function featured(event) {
    if (!event) return `<article class="feature-card empty-state"><h2>No featured event</h2><p>Choose another league to see the next available matchup.</p></article>`;
    return `<article class="feature-card">
      <div class="feature-art" style="background-image:linear-gradient(90deg,rgba(6,17,30,.98),rgba(6,17,30,.78),rgba(6,17,30,.35)),url('${esc(assets.eventImages?.[event.id] || assets.heroImages?.[event.league] || '')}')"></div>
      <div class="feature-content">
        <div class="eyebrow"><span class="live-pill">${esc(isLive(event) ? event.status : event.league)}</span><span>${esc(reasonFor(event))}</span></div>
        <p class="feature-label">FEATURED EVENT</p>
        <h1>${esc(event.awayName || event.away)} <span>vs</span> ${esc(event.homeName || event.home)}</h1>
        <div class="feature-matchup">
          <div>${logo(event.away)}<strong>${esc(event.away)}</strong></div>
          <b>${esc(event.score || `${shortTime(event)} ${zone}`)}</b>
          <div>${logo(event.home)}<strong>${esc(event.home)}</strong></div>
        </div>
        <p class="feature-context">${esc(contextFor(event))}</p>
        <div class="feature-facts">
          <span><small>STATUS</small><strong>${esc(event.detail || event.status)}</strong></span>
          <span><small>WATCH</small><strong>${esc(event.network || 'TBD')}</strong></span>
          <span><small>VENUE</small><strong>${esc(event.venue || 'TBD')}</strong></span>
        </div>
        ${event.odds ? `<div class="feature-odds"><span>${esc(event.odds.spread)}</span><span>${esc(event.odds.moneyline)}</span><span>${esc(event.odds.total)}</span></div>` : ''}
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

  function leagueBoard(league) {
    const page = (data.leaguePages || []).find(item => item.league === league) || (data.leaguePages || [])[0];
    if (!page) return '<div class="empty-state">No league detail is available.</div>';
    const resultRows = (page.results || []).map(game => `<div class="board-row"><span>${logo(game.away)}</span><strong>${esc(game.away)} <i>vs</i> ${esc(game.home)}</strong><em>${esc(game.score)}</em><small>${esc(game.detail)}</small></div>`).join('');
    const upcomingRows = (page.upcoming || []).map(game => `<div class="board-row"><span>${logo(game.away)}</span><strong>${esc(game.away)} <i>vs</i> ${esc(game.home)}</strong><em>${esc(game.odds || '')}</em><small>${esc(game.detail)}</small></div>`).join('');
    return `<section class="section league-section">
      <header class="section-head"><div><p>SELECTED LEAGUE</p><h2>${esc(leagueNames[page.league] || page.league)} Board</h2></div><span>RESULTS · UPCOMING · CONTEXT</span></header>
      <div class="league-summary"><div><b>LEAGUE STORYLINE</b><h3>${esc(page.headline)}</h3><p>${esc(page.summary)}</p></div><div class="stakes"><b>GAME WITH STAKES</b><strong>${esc(page.lead.away)} vs ${esc(page.lead.home)}</strong><span>${esc(page.lead.time)} · ${esc(page.lead.odds)}</span></div></div>
      <div class="board-columns"><div><h3>Latest results</h3>${resultRows}</div><div><h3>Coming up</h3>${upcomingRows}</div></div>
    </section>`;
  }

  function favoritesSection() {
    const favoriteEvents = (data.events || []).filter(isFavorite).slice(0, 3);
    const michigan = data.michigan;
    const cards = favoriteEvents.map(event => `<article class="favorite-card"><div class="favorite-mark">${logo(favoriteCodes.find(code => code === event.away || code === event.home) || event.away)}</div><div><b>FOLLOWING</b><h3>${esc(event.away)} vs ${esc(event.home)}</h3><p>${esc(dateTime(event))} ${zone} · ${esc(event.network || '')}</p><span>${esc(event.status)}</span></div></article>`);
    if (michigan && !favoriteEvents.some(event => event.away === 'MICH' || event.home === 'MICH')) cards.push(`<article class="favorite-card"><div class="favorite-mark">${logo('MICH')}</div><div><b>AP ${esc(michigan.ranking)}</b><h3>${esc(michigan.team)}</h3><p>Next: ${esc(michigan.nextGame.opponent)} · ${esc(new Intl.DateTimeFormat('en-US',{timeZone:tz,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(michigan.nextGame.start)))} ${zone}</p><span>${esc(michigan.record)} · ${esc(michigan.conference)}</span></div></article>`);
    return `<section class="section"><header class="section-head"><div><p>PERSONALIZED</p><h2>Your Teams</h2></div><span>${esc(favoriteCodes.join(' · '))}</span></header><div class="favorite-grid">${cards.join('') || '<p class="empty-state">Follow teams to put their games here.</p>'}</div></section>`;
  }

  function storiesSection() {
    const stories = (data.stories || []).slice(0, 3);
    return `<section class="section"><header class="section-head"><div><p>CONTEXT</p><h2>Stories & alerts</h2></div><span>WHY IT MATTERS</span></header><div class="story-grid">${stories.map(story => `<article><span>${esc(story[0])}</span><h3>${esc(story[1])}</h3><p>${esc(story[2])}</p><small>DEMO EDITORIAL · UPDATED TODAY</small></article>`).join('')}</div></section>`;
  }

  function render() {
    const all = sortedEvents();
    const live = all.filter(isLive);
    const scoreEvents = [...live, ...all.filter(event => !live.includes(event) && !isFinal(event))].slice(0, 5);
    const featureEvent = live[0] || all.find(isFavorite) || all[0];
    const watch = all.filter(event => event !== featureEvent && !isFinal(event)).slice(0, 5);
    const boardLeague = selectedLeague === 'ALL' ? featureEvent?.league || 'NFL' : selectedLeague;
    dashboard.innerHTML = `
      <header class="masthead">
        <div class="brand"><img src="assets/varycreative-mark.svg" alt="VC"><div><strong>VARYCAVE <span>SPORTSCENTER</span></strong><small id="currentDate">LOADING DATE</small></div></div>
        <div class="system-status"><div><span class="status-dot"></span><b>${esc(source)} DATA</b><small id="freshness">UPDATED NOW</small></div><time id="clock">--:--</time></div>
      </header>
      <nav class="league-nav" aria-label="Sports">${['ALL',...sports].map(sport => {const count=(data.events||[]).filter(e=>(sport==='ALL'||e.league===sport)&&isLive(e)).length;return `<button class="${selectedLeague===sport?'active':''}" data-league="${sport}"><span>${esc(leagueNames[sport]||sport)}</span>${count?`<b>${count} LIVE</b>`:'<small>VIEW</small>'}</button>`}).join('')}</nav>
      <section class="now-strip"><header><div><p>${live.length ? 'LIVE NOW · STARTING SOON' : 'STARTING NEXT'}</p><h2>${live.length ? `${live.length} active event${live.length===1?'':'s'} · next best windows` : 'Your next viewing windows'}</h2></div><span>ALL TIMES ${zone}</span></header><div class="score-grid">${scoreEvents.map(scoreCard).join('') || '<p class="empty-state">No events are available for this league.</p>'}</div></section>
      <section class="command-grid">${featured(featureEvent)}<aside class="watch-panel"><header><div><p>UP NEXT</p><h2>Worth watching</h2></div><span>${watch.length} EVENTS</span></header><div>${watch.map(watchRow).join('') || '<p class="empty-state">No additional events are scheduled.</p>'}</div></aside></section>
      ${favoritesSection()}
      ${leagueBoard(boardLeague)}
      ${storiesSection()}
      <footer><span><b>${esc(source)} DATA</b> · ${esc(zone)} · LAST REFRESH <strong id="footerUpdate">NOW</strong></span><span>${esc(config.odds?.disclaimer || 'ODDS INFORMATIONAL ONLY')}</span></footer>`;
    dashboard.querySelectorAll('[data-league]').forEach(button => button.addEventListener('click', () => {selectedLeague = button.dataset.league; render(); updateClock();}));
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
  requestAnimationFrame(() => document.getElementById('bootScreen')?.classList.add('done'));
  setTimeout(() => document.getElementById('bootScreen')?.remove(), 700);
})();
