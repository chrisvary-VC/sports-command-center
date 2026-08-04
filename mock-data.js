window.SPORTS_DATA = {
  heroSlides: [
    {
      league: "NFL", status: "FEATURED MATCHUP", title: "SUNDAY NIGHT FOOTBALL",
      awayMark: "DAL", awayName: "COWBOYS", awayRecord: "0–0",
      homeMark: "PHI", homeName: "EAGLES", homeRecord: "0–0",
      gameMeta: "KICKOFF IN", score: "02:18:44", venue: "AT&T STADIUM · ARLINGTON"
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
    ["NFL", "Training camp battles intensify as preseason approaches"],
    ["MLB", "Contenders survey the pitching market ahead of the deadline"],
    ["F1", "Race control reports a dry forecast for qualifying"],
    ["INDYCAR", "Championship fight tightens entering the next round"],
    ["NBA", "Summer roster moves reshape several rotations"]
  ],
  upcoming: [
    ["MLB", "Astros at Rangers · 7:05 PM"],
    ["NFL", "Cowboys vs Eagles · Sunday 7:20 PM"],
    ["F1", "Practice 1 · Friday 6:30 AM"],
    ["INDYCAR", "Qualifying · Saturday 2:00 PM"],
    ["NBA", "Season schedule module standing by"]
  ],
  leagues: [
    { name: "NFL", status: "PRESEASON", games: [
      ["DAL vs PHI", "SUN · 7:20 PM", "NBC"],
      ["KC vs BUF", "SUN · 3:25 PM", "CBS"],
      ["GB vs CHI", "MON · 7:15 PM", "ESPN"]
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
    ["MLB", "Trade deadline pressure rises as contenders hunt for pitching.", "A rotating headline module will pull from selected feeds and automatically remove duplicate stories."],
    ["NFL", "Position battles move under the lights as preseason football nears.", "Favorite-team stories receive priority without drowning out major league-wide developments."],
    ["F1", "Weather and tire strategy could shape the entire race weekend.", "Session-aware cards can switch between countdown, live timing, classification and final-result modes."],
    ["INDYCAR", "The championship fight enters another high-speed pressure cooker.", "Race control updates, cautions and position changes can feed a dedicated motorsports ticker."],
    ["NBA", "Roster changes create new questions before training camps open.", "The NBA panel can transition into live-score mode once the regular season begins."]
  ]
};