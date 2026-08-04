const data = window.SPORTS_DATA;
const config = window.DASHBOARD_CONFIG || {};

const $ = (id) => document.getElementById(id);
const root = document.documentElement;

root.style.setProperty("--accent", config.accent || "#ff4d1f");
root.style.setProperty("--accent-2", config.accentAlt || "#ffc247");
root.style.setProperty("--ticker-speed", `${config.tickerSpeedSeconds || 44}s`);
$("networkName").textContent = config.networkName || "THE CAVE SPORTS NETWORK";

function updateClock() {
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: config.timeFormat !== "24h"
  });
  $("date").textContent = now.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).toUpperCase();
  $("lastUpdate").textContent = now.toLocaleTimeString();
}
updateClock();
setInterval(updateClock, 1000);

const enabledSports = config.enabledSports || ["NFL", "NBA", "MLB", "F1", "INDYCAR"];
$("sportStrip").innerHTML = enabledSports.map((sport, index) =>
  `<span class="sport-chip ${index === 0 ? "active" : ""}" data-sport="${sport}">${sport}</span>`
).join("");

function setActiveSport(sport) {
  document.querySelectorAll(".sport-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.sport === sport);
  });
}

function tickerHTML(items) {
  const filtered = items.filter(([tag]) => enabledSports.includes(tag));
  const source = filtered.length ? filtered : items;
  return [...source, ...source].map(([tag, text]) =>
    `<span class="ticker-item"><b>${tag}</b>${text}</span>`
  ).join("");
}
$("breakingTicker").innerHTML = tickerHTML(data.breaking);
$("upcomingTicker").innerHTML = tickerHTML(data.upcoming);

const visibleLeagues = data.leagues.filter((league) => enabledSports.includes(league.name));
$("leagueGrid").innerHTML = visibleLeagues.map((league) => `
  <article class="league-card">
    <div class="league-card-header">
      <span class="league-name">${league.name}</span>
      <span class="card-status">${league.status}</span>
    </div>
    ${league.games.map((game) => `
      <div class="game-row">
        <div><div class="game-team">${game[0]}</div><div class="game-meta">${game[1]}</div></div>
        <div class="game-score">${game[2]}</div>
      </div>`).join("")}
  </article>`).join("");

$("raceCards").innerHTML = data.races.map((race) => `
  <article class="race-card">
    <div class="card-status">${race.series}</div>
    <div class="race-title">${race.title}</div>
    <div class="race-meta">${race.meta}</div>
    <div class="position-list">
      ${race.positions.map((p) => `
        <div class="position"><div class="position-num">${p[0]}</div><div>${p[1]}</div><div>${p[2]}</div></div>
      `).join("")}
    </div>
  </article>`).join("");

let heroIndex = 0;
const heroSlides = data.heroSlides.filter((slide) => enabledSports.includes(slide.league));
function renderHero() {
  const h = heroSlides[heroIndex];
  const values = {
    heroLeague: h.league,
    heroStatus: h.status,
    heroTitle: h.title,
    awayMark: h.awayMark,
    awayName: h.awayName,
    awayRecord: h.awayRecord,
    homeMark: h.homeMark,
    homeName: h.homeName,
    homeRecord: h.homeRecord,
    gameMeta: h.gameMeta,
    score: h.score,
    venue: h.venue
  };
  Object.entries(values).forEach(([id, value]) => $(id).textContent = value);
  setActiveSport(h.league);
  const progress = $("heroProgress");
  progress.style.animation = "none";
  requestAnimationFrame(() => {
    progress.style.animation = `heroProgress ${config.heroRotationMs || 12000}ms linear infinite`;
  });
}
renderHero();
setInterval(() => {
  const hero = $("hero");
  hero.classList.add("switching");
  setTimeout(() => {
    heroIndex = (heroIndex + 1) % heroSlides.length;
    renderHero();
    hero.classList.remove("switching");
  }, 350);
}, config.heroRotationMs || 12000);

let storyIndex = 0;
const stories = data.stories.filter(([league]) => enabledSports.includes(league));
function renderStory() {
  const [league, headline, summary] = stories[storyIndex];
  $("storyLeague").textContent = league;
  $("storyHeadline").textContent = headline;
  $("storySummary").textContent = summary;
  $("storyCounter").textContent = `${String(storyIndex + 1).padStart(2, "0")} / ${String(stories.length).padStart(2, "0")}`;
}
renderStory();
setInterval(() => {
  storyIndex = (storyIndex + 1) % stories.length;
  renderStory();
}, config.storyRotationMs || 9000);

window.addEventListener("error", () => {
  $("dataStatus").textContent = "DISPLAY DEGRADED";
});
