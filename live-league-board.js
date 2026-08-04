(() => {
  const data = window.SPORTS_DATA || {};
  const assets = window.SPORTS_ASSETS || {};
  const page = document.getElementById('leaguePage');
  const counter = document.getElementById('leaguePageCounter');
  if (!page || !counter) return;

  function restoreScoreTickers() {
    const stack = document.getElementById('tickerStack');
    if (!stack) return;
    const wanted = ['NFL', 'NCAAF', 'MLB'];
    const lanes = [...stack.querySelectorAll('.ticker')];
    lanes.forEach(lane => {
      const league = lane.querySelector('.ticker-label')?.textContent?.trim();
      lane.dataset.league = league || '';
      if (!wanted.includes(league)) lane.remove();
    });
    wanted.forEach(league => {
      const lane = stack.querySelector(`[data-league="${league}"]`);
      if (!lane) return;
      if (league === 'NCAAF') {
        const label = lane.querySelector('.ticker-label');
        if (label) label.innerHTML = '<span>NCAA</span><strong>TOP 25</strong>';
        lane.setAttribute('aria-label', 'NCAA Division I Top 25 football scores');
      }
      stack.appendChild(lane);
    });
    stack.classList.add('three-score-tickers');
  }

  const state = event => /FINAL|FT/i.test(event.status || '') ? 'final' : /LIVE|TOP|BOT|Q[1-4]|HALF|LAP/i.test(event.status || '') ? 'live' : 'scheduled';
  const leagueFromCounter = () => (counter.textContent || '').split(' · ')[0];
  const teamLogo = (event, side) => {
    const code = event[side];
    const src = event[`${side}Logo`] || assets.logos?.[code];
    return src ? `<img src="${src}" alt="${code} logo">` : `<span>${code}</span>`;
  };
  const leagueLogo = league => {
    const src = assets.leagueLogos?.[league];
    return src ? `<img src="${src}" alt="${league} logo">` : `<strong>${league}</strong>`;
  };
  const gameTime = event => {
    if (state(event) === 'live') return event.detail || 'LIVE';
    if (state(event) === 'final') return event.score || 'FINAL';
    return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(event.start)) + ' CT';
  };
  const line = event => [event.odds?.spread, event.odds?.total].filter(Boolean).join(' · ');

  function slateRow(event) {
    return `<article class="slate-row ${state(event)}">
      <div class="slate-time">${gameTime(event)}<small>${event.network || ''}</small></div>
      <div class="slate-team">${teamLogo(event, 'away')}<strong>${event.away}</strong></div>
      <b class="slate-versus">${event.score || 'AT'}</b>
      <div class="slate-team">${teamLogo(event, 'home')}<strong>${event.home}</strong></div>
      <em>${line(event)}</em>
    </article>`;
  }

  function trackedCard(event, index) {
    return `<article class="tracked-game ${state(event)}">
      <div class="tracked-rank">0${index + 1}</div>
      <div class="tracked-matchup">
        <div>${teamLogo(event, 'away')}<strong>${event.away}</strong></div>
        <b>${event.score || 'VS'}</b>
        <div>${teamLogo(event, 'home')}<strong>${event.home}</strong></div>
      </div>
      <div class="tracked-meta"><span>${gameTime(event)} · ${event.network || event.league}</span><em>${line(event)}</em></div>
    </article>`;
  }

  function render() {
    if (page.querySelector('.league-board-v3')) return;
    const league = leagueFromCounter();
    const games = (data.events || []).filter(event => event.league === league).sort((a, b) => new Date(a.start) - new Date(b.start));
    if (!games.length) return;
    const tracked = [...games].sort((a, b) => {
      const weight = event => state(event) === 'live' ? 0 : state(event) === 'scheduled' ? 1 : 2;
      return weight(a) - weight(b) || new Date(a.start) - new Date(b.start);
    }).slice(0, 6);
    page.innerHTML = `<section class="league-board-v3">
      <header class="board-v3-header"><div class="board-v3-logo">${leagueLogo(league)}</div><div><span>${league} COMMAND BOARD</span><h2>LEAGUE-WIDE GAME TRACKER</h2></div><em>${games.length} GAMES · LIVE FEED</em></header>
      <div class="board-v3-grid">
        <section class="full-slate-panel"><div class="panel-v3-title"><strong>FULL LEAGUE SLATE</strong><span>CHRONOLOGICAL · CENTRAL TIME</span></div><div class="slate-list">${games.map(slateRow).join('')}</div></section>
        <aside class="tracked-panel"><div class="panel-v3-title"><strong>TOP SIX TO TRACK</strong><span>LIVE FIRST · NEXT UP</span></div><div class="tracked-list">${tracked.map(trackedCard).join('')}</div></aside>
      </div>
    </section>`;
    counter.textContent = `${league} · FULL SLATE + TOP SIX TO TRACK`;
  }

  new MutationObserver(() => requestAnimationFrame(render)).observe(page, { childList: true });
  restoreScoreTickers();
  render();
})();
