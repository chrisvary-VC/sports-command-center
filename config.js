window.DASHBOARD_CONFIG = {
  version: "3.0",
  networkName: "THE CAVE SPORTS NETWORK",
  accent: "#ff4d1f",
  accentAlt: "#ffc247",
  timeFormat: "12h",
  heroRotationMs: 11000,
  storyRotationMs: 8500,
  tickerSpeedSeconds: 42,
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
  }
};
