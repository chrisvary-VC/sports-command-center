window.DASHBOARD_CONFIG = {
  version: "3.2",
  networkName: "THE CAVE SPORTS NETWORK",
  accent: "#e10600",
  accentAlt: "#f4f4f4",
  timeFormat: "12h",
  heroRotationMs: 10500,
  storyRotationMs: 8200,
  tickerSpeedSeconds: 38,
  enabledSports: ["NFL", "NBA", "MLB", "NHL", "NCAAF", "F1", "INDYCAR"],
  favorites: {
    nfl: ["DET"],
    nba: [],
    mlb: [],
    nhl: [],
    ncaaf: ["MICH"],
    f1Drivers: [],
    indycarDrivers: []
  },
  dedicatedModules: {
    michiganFootball: {
      enabled: true,
      teamCode: "MICH",
      title: "MICHIGAN FOOTBALL",
      showSchedule: true,
      showRecord: true,
      showRanking: true,
      showHeadlines: true
    }
  },
  scoreWall: {
    universalCoverage: true,
    gamesPerLeague: 4,
    tickerDirections: ["left", "right", "left", "right"]
  },
  priorityWeights: {
    live: 100,
    favorite: 35,
    upcoming: 20,
    breaking: 15,
    final: 8
  },
  modes: {
    auto: true,
    redZone: true,
    raceControl: true,
    quietHoursStart: 23,
    quietHoursEnd: 7
  },
  visualSystem: {
    name: "Apex Broadcast",
    clippedPanels: true,
    telemetryLines: true,
    highContrastNumbers: true
  }
};
