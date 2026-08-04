const data = window.SPORTS_DATA;
const config = window.DASHBOARD_CONFIG || {};
const $ = (id) => document.getElementById(id);
const root = document.documentElement;

root.style.setProperty('--accent', config.accent || '#e10600');
root.style.setProperty('--accent-2', config.accentAlt || '#f4f4f4');
root.style.setProperty('--ticker-speed', `${config.tickerSpeedSeconds || 38}s`);
$('networkName').textContent = config.networkName || 'THE CAVE SPORTS NETWORK';

function updateClock(){
  const now = new Date();
  $('clock').textContent = now.toLocaleTimeString([], {hour:'numeric', minute:'2-digit', hour12:config.timeFormat !== '24h'});
  $('date').textContent = now.toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'}).toUpperCase();
  $('lastUpdate').textContent = now.toLocaleTimeString();
}
updateClock(); setInterval(updateClock,1000);

const enabledSports = config.enabledSports || ['NFL','NBA','MLB','NHL','NCAAF','F1','INDYCAR'];
const favoriteTokens = Object.values(config.favorites || {}).flat();
const containsFavorite = (slide) => favoriteTokens.some((token) => [slide.awayMark,slide.homeMark,slide.awayName,slide.homeName].join(' ').includes(token));
const statusScore = (status='') => {
  const s = status.toUpperCase();
  if (s.includes('LIVE') || s.includes('INNING') || s.includes('LAP')) return config.priorityWeights?.live || 100;
  if (s.includes('FINAL')) return config.priorityWeights?.final || 8;
  if (s.includes('FEATURED') || s.includes('RACE WEEK') || s.includes('UPCOMING')) return config.priorityWeights?.upcoming || 20;
  return 10;
};

const heroSlides = data.heroSlides.filter((s)=>enabledSports.includes(s.league)).map((s)=>({...s,priority:statusScore(s.status)+(containsFavorite(s)?(config.priorityWeights?.favorite||35):0)})).sort((a,b)=>b.priority-a.priority);

function detectMode(slide){
  const hour = new Date().getHours();
  if (hour >= (config.modes?.quietHoursStart ?? 23) || hour < (config.modes?.quietHoursEnd ?? 7)) return ['NIGHT WATCH','Quiet-hour presentation with reduced visual intensity'];
  if (['F1','INDYCAR'].includes(slide.league) && config.modes?.raceControl) return ['RACE CONTROL',`${slide.league} has command priority`];
  if (slide.league === 'NFL' && config.modes?.redZone && new Date().getDay()===0) return ['RED ZONE','Sunday football priority is active'];
  return ['COMMAND MODE',`${slide.league} currently owns the highest priority score`];
}

$('sportStrip').innerHTML = enabledSports.map((sport)=>`<span class="sport-chip" data-sport="${sport}">${sport}</span>`).join('');
function setActiveSport(sport){ document.querySelectorAll('.sport-chip').forEach((c)=>c.classList.toggle('active',c.dataset.sport===sport)); }
function tickerHTML(items){ return [...items,...items].map((text)=>`<span class="ticker-item">${text}</span>`).join(''); }

$('tickerStack').innerHTML = data.tickerLanes.map((lane,index)=>`<section class="ticker ticker-lane"><div class="ticker-label">${lane.label}</div><div class="ticker-window"><div class="ticker-track ${lane.direction==='right'?'reverse':''}" style="animation-duration:${(config.tickerSpeedSeconds||38)+index*4}s">${tickerHTML(lane.items)}</div></div></section>`).join('');
$('upcomingTicker').innerHTML = [...data.upcoming,...data.upcoming].map(([tag,text])=>`<span class="ticker-item"><b>${tag}</b>${text}</span>`).join('');

const visibleLeagues = data.leagues.filter((league)=>enabledSports.includes(league.name));
$('leagueGrid').innerHTML = visibleLeagues.map((league)=>`<article class="league-card"><div class="league-card-header"><span class="league-name">${league.name}</span><span class="card-status">${league.status}</span></div>${league.games.map((g)=>`<div class="game-row"><div><div class="game-team">${g[0]}</div><div class="game-meta">${g[1]}</div></div><div class="game-score">${g[2]}</div></div>`).join('')}</article>`).join('');

const m = data.michigan;
$('michiganModule').innerHTML = `<article class="michigan-card"><div class="michigan-summary"><div><span class="card-status">${m.conference}</span><h2>${m.team}</h2><p>${m.record} · ${m.ranking}</p></div><div class="next-game"><span>NEXT GAME</span><strong>${m.nextGame.opponent}</strong><p>${m.nextGame.date} · ${m.nextGame.time} · ${m.nextGame.network}</p><small>${m.nextGame.venue}</small></div></div><div class="michigan-grid"><div><h3>UPCOMING SCHEDULE</h3>${m.schedule.map((g)=>`<div class="schedule-row"><span>${g[1]}</span><strong>${g[0]}</strong><em>${g[2]}</em></div>`).join('')}</div><div><h3>TEAM NOTES</h3>${m.notes.map((note)=>`<p class="team-note">${note}</p>`).join('')}</div></div></article>`;

$('raceCards').innerHTML = data.races.map((race)=>`<article class="race-card"><div class="card-status">${race.series}</div><div class="race-title">${race.title}</div><div class="race-meta">${race.meta}</div><div class="position-list">${race.positions.map((p)=>`<div class="position"><div class="position-num">${p[0]}</div><div>${p[1]}</div><div>${p[2]}</div></div>`).join('')}</div></article>`).join('');

let heroIndex=0;
function renderHero(){
  const h=heroSlides[heroIndex];
  const values={heroLeague:h.league,heroStatus:h.status,heroTitle:h.title,awayMark:h.awayMark,awayName:h.awayName,awayRecord:h.awayRecord,homeMark:h.homeMark,homeName:h.homeName,homeRecord:h.homeRecord,gameMeta:h.gameMeta,score:h.score,venue:h.venue};
  Object.entries(values).forEach(([id,v])=>$(id).textContent=v);
  $('priorityScore').textContent=`PRIORITY ${String(h.priority).padStart(3,'0')}`;
  $('intelRow').innerHTML=[['MODE',h.league],['STATUS',h.status],['FAVORITE',containsFavorite(h)?'YES':'NO']].map(([k,v])=>`<div class="intel"><span>${k}</span><strong>${v}</strong></div>`).join('');
  const [mode,reason]=detectMode(h); $('modeName').textContent=mode; $('modeReason').textContent=reason; $('dashboard').dataset.mode=mode.toLowerCase().replaceAll(' ','-');
  setActiveSport(h.league);
  const progress=$('heroProgress'); progress.style.animation='none'; requestAnimationFrame(()=>progress.style.animation=`heroProgress ${config.heroRotationMs||10500}ms linear infinite`);
}
renderHero();
setInterval(()=>{ const hero=$('hero'); hero.classList.add('switching'); setTimeout(()=>{heroIndex=(heroIndex+1)%heroSlides.length; renderHero(); hero.classList.remove('switching');},280); },config.heroRotationMs||10500);

let storyIndex=0; const stories=data.stories.filter(([league])=>enabledSports.includes(league));
function renderStory(){ const [league,headline,summary]=stories[storyIndex]; $('storyLeague').textContent=league; $('storyHeadline').textContent=headline; $('storySummary').textContent=summary; $('storyCounter').textContent=`${String(storyIndex+1).padStart(2,'0')} / ${String(stories.length).padStart(2,'0')}`; }
renderStory(); setInterval(()=>{storyIndex=(storyIndex+1)%stories.length;renderStory();},config.storyRotationMs||8200);
window.addEventListener('error',()=>{$('dataStatus').textContent='DISPLAY DEGRADED';});
