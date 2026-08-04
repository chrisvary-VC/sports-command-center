(function () {
  const assets = window.SPORTS_ASSETS || {};
  assets.leagueLogos = {
    NFL: "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png",
    NBA: "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
    MLB: "https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png",
    NHL: "https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png",
    NCAAF: "assets/ncaa-wordmark.png",
    F1: "https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg",
    INDYCAR: "https://upload.wikimedia.org/wikipedia/commons/2/21/IndyCar_Series_logo.svg"
  };
  const branded = new Set(Object.keys(assets.leagueLogos));
  const leagueTitles = {
    NFL: "SUNDAY GRIDIRON",
    NBA: "HARDWOOD AFTER DARK",
    MLB: "THE DIAMOND DAILY",
    NHL: "ICE LEVEL",
    NCAAF: "SATURDAY CAMPUS",
    F1: "LIGHTS OUT",
    INDYCAR: "OPEN WHEEL AMERICA"
  };
  const leagueMark = league => assets.leagueLogos[league] ? `<img class="league-brand-image" src="${assets.leagueLogos[league]}" alt="${league}">` : league;
  const teamMark = code => assets.logos?.[code] ? `<img src="${assets.logos[code]}" alt="${code}">` : `<span>${code}</span>`;
  const stateOf = event => /LIVE|TOP|BOT|Q[1-4]|HALF|LAP/i.test(event.status || "") ? "live" : /FINAL|FT/i.test(event.status || "") ? "final" : "upcoming";
  const featureLabels = {
    MLB: ["GAME OF THE DAY", "THE BIG ONE"],
    F1: ["RACE OF THE WEEK", "THE BIG ONE"],
    INDYCAR: ["RACE OF THE WEEK", "THE BIG ONE"],
    NFL: ["GAME OF THE WEEK", "THE BIG ONE"],
    NBA: ["GAME OF THE WEEK", "THE BIG ONE"],
    NHL: ["GAME OF THE WEEK", "THE BIG ONE"],
    NCAAF: ["GAME OF THE WEEK", "THE BIG ONE"]
  };

  function brandNavigation() {
    document.querySelectorAll(".sport-chip").forEach(chip => {
      const league = chip.dataset.sport;
      if (!branded.has(league)) return;
      chip.classList.add("logo-only");
      chip.innerHTML = leagueMark(league);
      chip.setAttribute("aria-label", league);
    });
  }

  function rowsFor(featured) {
    const data = window.SPORTS_DATA || {};
    return (data.events || []).filter(event => event.league === featured.league).slice(0, 6);
  }

  function renderBoard(featured) {
    const board = document.getElementById("heroMarketBoard");
    if (!board || !featured) return;
    board.innerHTML = `<div class="market-head"><div class="market-brand">${leagueMark(featured.league)}</div><div><strong>FULL LEAGUE SLATE</strong><span>ALL GAMES · CENTRAL TIME</span></div><em>LINES</em></div><div class="market-games">${rowsFor(featured).map(game => {
      const state = stateOf(game);
      const result = game.score || game.detail || game.status || "—";
      const line = game.odds?.spread || game.odds || "—";
      return `<div class="market-game ${state}"><div class="market-team"><i>${teamMark(game.away)}</i><strong>${game.away}</strong><span>at</span><strong>${game.home}</strong><i>${teamMark(game.home)}</i></div><div class="market-result">${result}</div><div class="market-line">${line}</div></div>`;
    }).join("")}</div>`;
  }

  function renderFeature(featured) {
    if (!featured) return;
    const data = window.SPORTS_DATA || {};
    const page = (data.leaguePages || []).find(item => item.league === featured.league);
    const labels = featureLabels[featured.league] || ["GAME OF THE WEEK", "THE BIG ONE"];
    const label = document.getElementById("featuredGameLabel");
    const nickname = document.getElementById("featuredGameNickname");
    if (label) label.textContent = labels[0];
    if (nickname) nickname.textContent = labels[1];
    const candidates = [...(page?.upcoming || []), ...(page?.marquee || [])]
      .filter(game => !(game.away === featured.away && game.home === featured.home))
      .slice(0, 3);
    const watchlist = document.getElementById("heroWatchlist");
    if (!watchlist) return;
    watchlist.innerHTML = `<div class="watchlist-title"><strong>THREE TO KEEP THE REMOTE FOR</strong><span>TOP GAMES TO WATCH</span></div><div class="watchlist-games">${candidates.map((game, index) => `<article class="watch-game"><b>0${index + 1}</b><div class="watch-match"><i>${teamMark(game.away)}</i><strong>${game.away}</strong><span>vs</span><strong>${game.home}</strong><i>${teamMark(game.home)}</i></div><small>${game.detail || game.odds || "UPCOMING"}</small></article>`).join("")}</div>`;
  }

  function syncHero() {
    const pill = document.getElementById("heroLeague");
    const league = pill?.textContent?.trim() || pill?.dataset.league;
    if (!league) return;
    pill.dataset.league = league;
    const featured = (window.SPORTS_DATA?.events || []).find(event => event.league === league);
    renderBoard(featured);
    renderFeature(featured);
    const title = document.getElementById("heroTitle");
    if (title && leagueTitles[league]) title.textContent = leagueTitles[league];
    const hero = document.getElementById("hero");
    if (hero) hero.dataset.league = league;
    if (branded.has(league)) {
      pill.classList.add("logo-only");
      if (!pill.querySelector("img")) pill.innerHTML = leagueMark(league);
    } else {
      pill.classList.remove("logo-only");
    }
  }

  function mount() {
    const content = document.querySelector(".hero-content");
    const matchup = content?.querySelector(".matchup");
    if (!content || !matchup || document.getElementById("heroMarketBoard")) return;
    const stage = document.createElement("div");
    stage.className = "hero-command-stage";
    const feature = document.createElement("div");
    feature.className = "hero-feature";
    matchup.before(stage);
    const featureHead = document.createElement("header");
    featureHead.className = "featured-game-head";
    featureHead.innerHTML = `<div><span id="featuredGameLabel">GAME OF THE WEEK</span><strong id="featuredGameNickname">THE BIG ONE</strong></div><em>FEATURED</em>`;
    feature.append(featureHead);
    feature.append(matchup);
    [content.querySelector("#heroOdds"), content.querySelector("#intelRow")].filter(Boolean).forEach(node => feature.append(node));
    const watchlist = document.createElement("section");
    watchlist.id = "heroWatchlist";
    watchlist.className = "hero-watchlist";
    feature.append(watchlist);
    const board = document.createElement("aside");
    board.id = "heroMarketBoard";
    board.className = "hero-market-board";
    stage.append(feature, board);
    const pill = document.getElementById("heroLeague");
    new MutationObserver(syncHero).observe(pill, { childList: true, characterData: true, subtree: true });
    const sportStrip = document.getElementById("sportStrip");
    if (sportStrip) new MutationObserver(brandNavigation).observe(sportStrip, { childList: true });
    brandNavigation();
    syncHero();
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (document.querySelector(".matchup") || attempts > 40) {
      clearInterval(timer);
      mount();
    }
  }, 150);
})();
