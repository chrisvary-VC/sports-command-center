window.SPORTS_DATA = {
  heroSlides: [
    {
      league: "NFL", status: "FAVORITE TEAM", title: "DETROIT LIONS FOOTBALL",
      awayMark: "DET", awayName: "LIONS", awayRecord: "NFC NORTH",
      homeMark: "GB", homeName: "PACKERS", homeRecord: "DIVISION RIVAL",
      gameMeta: "KICKOFF COUNTDOWN", score: "03:18:44", venue: "FORD FIELD · DETROIT"
    },
    {
      league: "NCAAF", status: "MICHIGAN ONLY", title: "GO BLUE GAME CENTER",
      awayMark: "MICH", awayName: "WOLVERINES", awayRecord: "BIG TEN",
      homeMark: "OSU", homeName: "BUCKEYES", homeRecord: "THE GAME",
      gameMeta: "SATURDAY KICKOFF", score: "12:00 PM", venue: "MICHIGAN STADIUM · ANN ARBOR"
    },
    {
      league: "F1", status: "RACE WEEK", title: "GRAND PRIX COUNTDOWN",
      awayMark: "NOR", awayName: "NORRIS", awayRecord: "P1 · 188 PTS",
      homeMark: "PIA", homeName: "PIASTRI", homeRecord: "P2 · 176 PTS",
      gameMeta: "LIGHTS OUT IN", score: "18:42:10", venue: "CIRCUIT DE SPA-FRANCORCHAMPS"
    },
    {
      league: "MLB", status: "LIVE · 7TH INNING", title: "DIVISION SHOWDOWN",
      awayMark: "HOU", awayName: "ASTROS", awayRecord: "63–48",
      homeMark: "TEX", homeName: "RANGERS", homeRecord: "59–52",
      gameMeta: "TOP 7 · 1 OUT", score: "4 — 3", venue: "GLOBE LIFE FIELD"
    }
  ],
  breaking: [
    ["NFL", "Detroit Lions roster, injuries and game updates receive top priority"],
    ["NCAAF", "Michigan football news only: kickoff, rankings, injuries and results"],
    ["MLB", "Contenders survey the pitching market ahead of the deadline"],
    ["F1", "Race control reports a dry forecast for qualifying"],
    ["INDYCAR", "Championship fight tightens entering the next round"],
    ["NBA", "Summer roster moves reshape several rotations"]
  ],
  upcoming: [
    ["NFL", "Lions vs Packers · Sunday 12:00 PM"],
    ["NCAAF", "Michigan vs Ohio State · Saturday 12:00 PM"],
    ["MLB", "Astros at Rangers · 7:05 PM"],
    ["F1", "Practice 1 · Friday 6:30 AM"],
    ["INDYCAR", "Qualifying · Saturday 2:00 PM"],
    ["NBA", "Season schedule module standing by"]
  ],
  leagues: [
    { name: "NFL", status: "LIONS FIRST", games: [
      ["DET vs GB", "SUN · 12:00 PM", "FOX"],
      ["DET at MIN", "NEXT WEEK", "TBD"],
      ["NFC North", "DIVISION WATCH", "01"]
    ]},
    { name: "NCAAF", status: "MICHIGAN ONLY", games: [
      ["MICH vs OSU", "SAT · 12:00 PM", "FOX"],
      ["Michigan Ranking", "AP / CFP", "—"],
      ["Big Ten Race", "WOLVERINES", "TRACK"]
    ]},
    { name: "NBA", status: "OFFSEASON", games: [
      ["Free Agency", "LATEST MOVES", "12"],
      ["Power Rankings", "UPDATED", "01"],
      ["Opening Night", "COUNTDOWN", "78D"]
    ]},
    { name: "MLB", status: "3 LIVE", games: [
      ["HOU at TEX", "TOP 7", "4–3"],
      ["NYY at BOS", "BOT 5", "2–2"],
      ["LAD at SD", "8:40 PM", "—"]
    ]}
  ],
  races: [
    { series: "FORMULA 1", title: "BELGIAN GRAND PRIX", meta: "RACE · SUNDAY 8:00 AM", positions: [
      ["1", "Lando Norris", "+0.000"],
      ["2", "Oscar Piastri", "+4.212"],
      ["3", "Max Verstappen", "+7.830"]
    ]},
    { series: "INDYCAR", title: "ROAD AMERICA", meta: "QUALIFYING · SATURDAY 2:00 PM", positions: [
      ["1", "Álex Palou", "386 PTS"],
      ["2", "Pato O’Ward", "341 PTS"],
      ["3", "Scott McLaughlin", "318 PTS"]
    ]}
  ],
  stories: [
    ["NFL", "Detroit Lions coverage moves to the front of the dashboard.", "Schedules, scores, injuries and standings will prioritize Detroit whenever live data is connected."],
    ["NCAAF", "College football coverage is restricted to Michigan.", "The dashboard will ignore unrelated college games and focus on Wolverines schedules, rankings, results and news."],
    ["MLB", "Trade deadline pressure rises as contenders hunt for pitching.", "A rotating headline module will pull from selected feeds and automatically remove duplicate stories."],
    ["F1", "Weather and tire strategy could shape the entire race weekend.", "Session-aware cards can switch between countdown, live timing, classification and final-result modes."],
    ["INDYCAR", "The championship fight enters another high-speed pressure cooker.", "Race control updates, cautions and position changes can feed a dedicated motorsports ticker."],
    ["NBA", "Roster changes create new questions before training camps open.", "The NBA panel can transition into live-score mode once the regular season begins."]
  ]
};