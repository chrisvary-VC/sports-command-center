const data = window.SPORTS_DATA;

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString([], {hour: "numeric", minute: "2-digit"});
  document.getElementById("date").textContent =
    now.toLocaleDateString([], {weekday: "long", month: "short", day: "numeric"}).toUpperCase();
  document.getElementById("lastUpdate").textContent = now.toLocaleTimeString();
}
updateClock();
setInterval(updateClock, 1000);

function tickerHTML(items) {
  const doubled = [...items, ...items];
  return doubled.map(([tag, text]) =>
    `<span class="ticker-item"><b>${tag}</b>${text}</span>`).join("");
}
document.getElementById("breakingTicker").innerHTML = tickerHTML(data.breaking);
document.getElementById("upcomingTicker").innerHTML = tickerHTML(data.upcoming);

document.getElementById("leagueGrid").innerHTML = data.leagues.map(league => `
  <article class="league-card">
    <div class="league-card-header">
      <span class="league-name">${league.name}</span>
      <span class="card-status">${league.status}</span>
    </div>
    ${league.games.map(game => `
      <div class="game-row">
        <div>
          <div class="game-team">${game[0]}</div>
          <div class="game-meta">${game[1]}</div>
        </div>
        <div class="game-score">${game[2]}</div>
      </div>`).join("")}
  </article>`).join("");

document.getElementById("raceCards").innerHTML = data.races.map(race => `
  <article class="race-card">
    <div class="card-status">${race.series}</div>
    <div class="race-title">${race.title}</div>
    <div class="race-meta">${race.meta}</div>
    <div class="position-list">
      ${race.positions.map(p => `
        <div class="position">
          <div class="position-num">${p[0]}</div>
          <div>${p[1]}</div>
          <div>${p[2]}</div>
        </div>`).join("")}
    </div>
  </article>`).join("");

let heroIndex = 0;
function renderHero() {
  const h = data.heroSlides[heroIndex];
  const map = {
    heroLeague: h.league, heroStatus: h.status, heroTitle: h.title,
    awayMark: h.awayMark, awayName: h.awayName, awayRecord: h.awayRecord,
    homeMark: h.homeMark, homeName: h.homeName, homeRecord: h.homeRecord,
    gameMeta: h.gameMeta, score: h.score, venue: h.venue
  };
  Object.entries(map).forEach(([id, value]) => document.getElementById(id).textContent = value);
}
renderHero();
setInterval(() => {
  heroIndex = (heroIndex + 1) % data.heroSlides.length;
  renderHero();
}, 12000);

let storyIndex = 0;
function renderStory() {
  const [league, headline, summary] = data.stories[storyIndex];
  document.getElementById("storyLeague").textContent = league;
  document.getElementById("storyHeadline").textContent = headline;
  document.getElementById("storySummary").textContent = summary;
  document.getElementById("storyCounter").textContent =
    `${String(storyIndex + 1).padStart(2,"0")} / ${String(data.stories.length).padStart(2,"0")}`;
}
renderStory();
setInterval(() => {
  storyIndex = (storyIndex + 1) % data.stories.length;
  renderStory();
}, 9000);
