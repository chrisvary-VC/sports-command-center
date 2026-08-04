(() => {
  let data = window.SPORTS_DATA || { events: [] };
  const config = window.DASHBOARD_CONFIG || {};
  const assets = window.SPORTS_ASSETS || {};
  const $ = id => document.getElementById(id);
  const zone = config.timeZone || 'America/Chicago';
  const zoneLabel = config.timeZoneLabel || 'CT';
  const leagueLogos = {
    NFL: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
    NBA: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
    MLB: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
    NHL: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
    NCAAF: 'assets/ncaa-wordmark.png',
    F1: 'https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg',
    INDYCAR: 'https://upload.wikimedia.org/wikipedia/commons/2/21/IndyCar_Series_logo.svg'
  };
  const titles = { NFL: 'SUNDAY GRIDIRON', NBA: 'HARDWOOD AFTER DARK', MLB: 'THE DIAMOND DAILY', NHL: 'ICE LEVEL', NCAAF: 'SATURDAY CAMPUS', F1: 'LIGHTS OUT', INDYCAR: 'OPEN WHEEL AMERICA' };
  const heroImages = { ...assets.heroImages, NFL: assets.eventImages?.['DET-GB'] || assets.heroImages?.NFL };
  const enabled = (config.enabledSports || []).filter(league => data.events.some(event => event.league === league));
  let activeLeague = enabled[0] || data.events[0]?.league;

  const state = event => /LIVE|TOP|BOT|Q[1-4]|HALF|LAP/i.test(event.status || '') ? 'live' : /FINAL|FT/i.test(event.status || '') ? 'final' : 'scheduled';
  const weight = event => state(event) === 'live' ? 0 : state(event) === 'scheduled' ? 1 : 2;
  const teamLogo = (event, side) => event?.[`${side}Logo`] || assets.logos?.[event?.[side]] || '';
  const img = (src, alt) => src ? `<img src="${src}" alt="${alt}">` : `<span>${alt}</span>`;
  const leagueLogo = league => img(leagueLogos[league], `${league} logo`);
  const eventTime = event => {
    if (state(event) === 'live') return event.detail || 'LIVE';
    if (state(event) === 'final') return event.score || 'FINAL';
    return new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(event.start)) + ` ${zoneLabel}`;
  };
  const line = event => [event.odds?.spread, event.odds?.total].filter(Boolean).join(' · ');
  const gamesFor = league => data.events.filter(event => event.league === league).sort((a, b) => weight(a) - weight(b) || new Date(a.start) - new Date(b.start));

  function updateClock() {
    const now = new Date();
    $('clock').textContent = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(now);
    $('date').textContent = new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'long', month: 'short', day: 'numeric' }).format(now).toUpperCase() + ` · ${zoneLabel}`;
    $('lastUpdate').textContent = `UPDATED ${new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(now)} ${zoneLabel}`;
  }

  function buildNav() {
    $('sportStrip').style.setProperty('--league-count', enabled.length || 1);
    $('sportStrip').innerHTML = enabled.map(league => `<button type="button" data-league="${league}" aria-label="${league}">${leagueLogo(league)}</button>`).join('');
    $('sportStrip').addEventListener('click', event => {
      const button = event.target.closest('button[data-league]');
      if (!button) return;
      selectLeague(button.dataset.league);
    });
    $('sportStrip').addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      const index = (enabled.indexOf(activeLeague) + offset + enabled.length) % enabled.length;
      selectLeague(enabled[index]);
      $('sportStrip').querySelector(`[data-league="${enabled[index]}"]`)?.focus();
    });
  }

  function watchRow(event, index) {
    return `<article class="watch-row ${state(event)}"><span class="rank">0${index + 1}</span><div class="watch-team">${img(teamLogo(event, 'away'), event.away)}<b>${event.away}</b></div><em>${event.score || 'VS'}</em><div class="watch-team home">${img(teamLogo(event, 'home'), event.home)}<b>${event.home}</b></div><div class="watch-meta"><span>${eventTime(event)}${event.network ? ` · ${event.network}` : ''}</span><b>${line(event)}</b></div></article>`;
  }

  function renderLeague() {
    const games = gamesFor(activeLeague);
    const featured = games[0];
    if (!featured) return;
    document.documentElement.dataset.league = activeLeague;
    $('sportStrip').querySelectorAll('button').forEach(button => button.classList.toggle('active', button.dataset.league === activeLeague));
    $('heroLeague').innerHTML = leagueLogo(activeLeague);
    $('heroStatus').textContent = state(featured) === 'live' ? '● LIVE' : featured.status || 'UPCOMING';
    $('heroNetwork').textContent = featured.network || '';
    $('featureLabel').textContent = activeLeague === 'MLB' ? 'GAME OF THE DAY' : 'FEATURED MATCHUP';
    $('heroTitle').textContent = titles[activeLeague] || activeLeague;
    $('awayMark').innerHTML = img(teamLogo(featured, 'away'), featured.away);
    $('homeMark').innerHTML = img(teamLogo(featured, 'home'), featured.home);
    $('awayName').textContent = featured.awayName || featured.away;
    $('homeName').textContent = featured.homeName || featured.home;
    $('awayCode').textContent = featured.away;
    $('homeCode').textContent = featured.home;
    $('gameMeta').textContent = state(featured) === 'live' ? featured.detail || 'LIVE' : 'STARTS';
    $('score').textContent = featured.score || eventTime(featured).replace(` ${zoneLabel}`, '');
    $('venue').textContent = [featured.venue, featured.network].filter(Boolean).join(' · ');
    $('heroPhoto').style.backgroundImage = `url('${assets.eventImages?.[featured.id] || heroImages?.[activeLeague] || ''}')`;
    $('heroOdds').innerHTML = [['SPREAD', featured.odds?.spread], ['MONEYLINE', featured.odds?.moneyline], ['TOTAL', featured.odds?.total]].filter(item => item[1]).map(item => `<div><span>${item[0]}</span><b>${item[1]}</b></div>`).join('') || '<div><span>MARKETS</span><b>NOT POSTED</b></div>';
    $('watchLeague').textContent = activeLeague;
    const watch = games.filter(event => event.id !== featured.id).slice(0, 6);
    $('watchList').innerHTML = watch.map(watchRow).join('');
  }

  function selectLeague(league) {
    if (!enabled.includes(league)) return;
    activeLeague = league;
    renderLeague();
  }

  function buildLiveBoard() {
    const games = [...data.events].sort((a, b) => weight(a) - weight(b) || new Date(a.start) - new Date(b.start)).slice(0, 12);
    const cards = games.map(event => `<article class="board-card ${state(event)}"><span>${event.league}</span>${img(teamLogo(event, 'away'), event.away)}<b>${event.away} ${event.score || 'vs'} ${event.home}</b><em>${line(event) || eventTime(event)}</em></article>`).join('');
    $('arenaRibbon').innerHTML = cards + cards;
  }

  function buildTickers() {
    const wanted = ['NFL', 'NCAAF', 'MLB'].filter(league => enabled.includes(league));
    $('tickerStack').innerHTML = wanted.map(league => {
      const label = league === 'NCAAF' ? '<span>NCAA</span><b>TOP 25</b>' : `<b>${league}</b>`;
      const items = gamesFor(league).slice(0, 12).map(event => `<span>${event.away} vs ${event.home} · ${event.score || eventTime(event)}${line(event) ? ` · ${line(event)}` : ''}</span>`).join('');
      return `<div class="ticker" data-league="${league}"><div class="ticker-label">${label}</div><div class="ticker-window"><div class="ticker-track">${items}${items}</div></div></div>`;
    }).join('');
  }

  buildNav();
  renderLeague();
  buildLiveBoard();
  buildTickers();
  updateClock();
  setInterval(updateClock, 1000);
  $('dataStatus').textContent = `${window.VARYCAVE_DATA_SOURCE || 'OFFLINE'} DATA · ${zoneLabel}`;
  $('bootScreen')?.classList.add('done');
  setTimeout(() => $('bootScreen')?.remove(), 500);
  window.addEventListener('varycave:data', event => {
    data = event.detail || data;
    renderLeague();
    buildLiveBoard();
    buildTickers();
  });
})();
