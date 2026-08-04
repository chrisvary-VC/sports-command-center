window.DASHBOARD_CONFIG = {
  version: "3.1",
  networkName: "THE CAVE SPORTS NETWORK",
  accent: "#e10600",
  accentAlt: "#f4f4f4",
  timeFormat: "12h",
  heroRotationMs: 10500,
  storyRotationMs: 8200,
  tickerSpeedSeconds: 40,
  enabledSports: ["NFL", "NBA", "MLB", "F1", "INDYCAR"],
  favorites: {
    nfl: ["DAL"],
    nba: [],
    mlb: ["TEX"],
    f1Drivers: [],
    indycarDrivers: []
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
