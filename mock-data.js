window.SPORTS_DATA = {
  heroSlides: [
    { league:"NFL", status:"FEATURED MATCHUP", title:"PRIMETIME FOOTBALL", awayMark:"DET", awayName:"LIONS", awayRecord:"0–0", homeMark:"GB", homeName:"PACKERS", homeRecord:"0–0", gameMeta:"KICKOFF IN", score:"02:18:44", venue:"LAMBEAU FIELD · GREEN BAY" },
    { league:"F1", status:"RACE WEEK", title:"GRAND PRIX COUNTDOWN", awayMark:"NOR", awayName:"NORRIS", awayRecord:"P1 · 188 PTS", homeMark:"PIA", homeName:"PIASTRI", homeRecord:"P2 · 176 PTS", gameMeta:"LIGHTS OUT IN", score:"18:42:10", venue:"CIRCUIT DE SPA-FRANCORCHAMPS" },
    { league:"MLB", status:"LIVE · 7TH INNING", title:"NATIONAL SCOREBOARD", awayMark:"HOU", awayName:"ASTROS", awayRecord:"63–48", homeMark:"SEA", homeName:"MARINERS", homeRecord:"61–50", gameMeta:"TOP 7 · 1 OUT", score:"4 — 3", venue:"T-MOBILE PARK · SEATTLE" },
    { league:"NBA", status:"UPCOMING", title:"PRIMETIME BASKETBALL", awayMark:"BOS", awayName:"CELTICS", awayRecord:"58–24", homeMark:"DEN", homeName:"NUGGETS", homeRecord:"55–27", gameMeta:"TIPOFF IN", score:"05:31:12", venue:"BALL ARENA · DENVER" },
    { league:"NHL", status:"UPCOMING", title:"HOCKEY NIGHT", awayMark:"EDM", awayName:"OILERS", awayRecord:"49–27–6", homeMark:"FLA", homeName:"PANTHERS", homeRecord:"52–24–6", gameMeta:"PUCK DROP IN", score:"03:44:09", venue:"AMERANT BANK ARENA" },
    { league:"INDYCAR", status:"RACE WEEK", title:"INDYCAR COUNTDOWN", awayMark:"PAL", awayName:"PALOU", awayRecord:"P1 · 386 PTS", homeMark:"OWD", homeName:"O’WARD", homeRecord:"P2 · 341 PTS", gameMeta:"GREEN FLAG IN", score:"21:05:30", venue:"ROAD AMERICA · ELKHART LAKE" }
  ],

  tickerLanes: [
    { label:"NFL", direction:"left", items:["Lions open NFC North slate under the lights","Chiefs and Bills headline the national window","Injury reports and depth-chart battles update throughout the day","League-wide scores will populate here once live feeds are connected"] },
    { label:"MLB", direction:"right", items:["Astros and Mariners trade late-inning runs","Yankees and Red Sox tied in the fifth","Dodgers visit San Diego in the late window","Wild-card standings tighten across both leagues"] },
    { label:"NCAA", direction:"left", items:["Michigan schedule and team notes live in the dedicated module","Top-25 games rotate through the national scoreboard","Conference races and playoff implications update weekly","Saturday kickoffs flow into the universal score wall"] },
    { label:"MOTOR", direction:"right", items:["F1 qualifying weather remains dry","IndyCar championship battle tightens","Race Control messages and flags appear here","Session countdowns update automatically"] }
  ],

  breaking: [
    ["NFL","League-wide camp and roster updates"],
    ["MLB","Contenders survey the pitching market"],
    ["NBA","Schedule and roster developments"],
    ["NHL","Free agency and training-camp notes"],
    ["NCAAF","Top-25 and conference updates"],
    ["F1","Race Control reports dry qualifying conditions"],
    ["INDYCAR","Championship fight tightens entering the next round"]
  ],

  upcoming: [
    ["NFL","Lions at Packers · Sunday 7:20 PM"],
    ["MLB","Astros at Mariners · 9:40 PM"],
    ["NBA","Celtics at Nuggets · 8:00 PM"],
    ["NHL","Oilers at Panthers · 7:30 PM"],
    ["NCAAF","Michigan vs Fresno State · Saturday 7:30 PM"],
    ["F1","Practice 1 · Friday 6:30 AM"],
    ["INDYCAR","Qualifying · Saturday 2:00 PM"]
  ],

  leagues: [
    { name:"NFL", status:"4 GAMES", games:[
      ["DET at GB","SUN · 7:20 PM","NBC"],
      ["KC at BUF","SUN · 3:25 PM","CBS"],
      ["SF at PHI","SUN · 12:00 PM","FOX"],
      ["BAL at CIN","MON · 7:15 PM","ESPN"]
    ]},
    { name:"NBA", status:"4 GAMES", games:[
      ["BOS at DEN","8:00 PM","TNT"],
      ["LAL at PHX","9:00 PM","ESPN"],
      ["MIL at NYK","6:30 PM","NBA TV"],
      ["GSW at SAC","9:30 PM","—"]
    ]},
    { name:"MLB", status:"4 LIVE", games:[
      ["HOU at SEA","TOP 7","4–3"],
      ["NYY at BOS","BOT 5","2–2"],
      ["CHC at STL","FINAL","6–4"],
      ["LAD at SD","9:40 PM","—"]
    ]},
    { name:"NHL", status:"4 GAMES", games:[
      ["EDM at FLA","7:30 PM","ESPN"],
      ["COL at DAL","8:00 PM","TNT"],
      ["TOR at MTL","6:00 PM","SN"],
      ["NYR at NJD","7:00 PM","MSG"]
    ]},
    { name:"NCAAF", status:"TOP 25", games:[
      ["UGA vs CLEM","12:00 PM","ABC"],
      ["TEX at MICH","11:00 AM","FOX"],
      ["LSU at USC","6:30 PM","ESPN"],
      ["ND at TAMU","6:30 PM","ABC"]
    ]}
  ],

  michigan: {
    team:"MICHIGAN WOLVERINES",
    record:"0–0",
    ranking:"AP #9",
    conference:"BIG TEN",
    nextGame:{ opponent:"FRESNO STATE", date:"SAT · AUG 31", time:"7:30 PM", network:"NBC", venue:"MICHIGAN STADIUM" },
    schedule:[
      ["FRESNO STATE","AUG 31","HOME"],
      ["TEXAS","SEP 7","HOME"],
      ["ARKANSAS STATE","SEP 14","HOME"],
      ["USC","SEP 21","HOME"],
      ["MINNESOTA","SEP 28","HOME"]
    ],
    notes:["Quarterback competition remains the central camp storyline","Defense returns a veteran core","Big Ten schedule features several marquee home dates"]
  },

  races: [
    { series:"FORMULA 1", title:"BELGIAN GRAND PRIX", meta:"RACE · SUNDAY 8:00 AM", positions:[["1","Lando Norris","+0.000"],["2","Oscar Piastri","+4.212"],["3","Max Verstappen","+7.830"],["4","George Russell","+12.401"]] },
    { series:"INDYCAR", title:"ROAD AMERICA", meta:"QUALIFYING · SATURDAY 2:00 PM", positions:[["1","Álex Palou","386 PTS"],["2","Pato O’Ward","341 PTS"],["3","Scott McLaughlin","318 PTS"],["4","Colton Herta","302 PTS"]] }
  ],

  stories: [
    ["NFL","The national picture starts taking shape before opening weekend.","The scoreboard now emphasizes league-wide games while still boosting Detroit when the Lions are relevant."],
    ["MLB","Wild-card races tighten as the schedule enters its pressure phase.","Multiple games, standings implications, and late-inning updates can rotate through the universal score wall."],
    ["NCAAF","The top-25 board builds toward another loaded Saturday.","Michigan has its own dedicated module while national college football remains fully represented."],
    ["F1","Weather and tyre strategy could define the entire race weekend.","Race Control keeps the F1-inspired visual language as the dashboard’s design anchor."],
    ["INDYCAR","The title fight enters another high-speed pressure cooker.","Qualifying, points, cautions, and race-control messages share the motorsport presentation."],
    ["NBA","National matchups and roster questions shape the next slate.","The basketball module expands beyond a single local team or market."],
    ["NHL","Hockey coverage joins the universal command wall.","National games and marquee matchups appear without forcing a Texas-only perspective."]
  ]
};
