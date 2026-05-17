window.POOL_CONFIG = {
  // Paste your Google Apps Script web app URL here when ready.
  // Example: "https://script.google.com/macros/s/AKfycbx.../exec"
  dataUrl: "",
  refreshMinutes: 0,
  titleFallback: "Anderson World Cup Pool",
  subtitleFallback: "Live results, group rankings, knockout bracket, and tiebreakers."
};

window.POOL_DATA = {
  title: "Anderson World Cup Pool",
  subtitle: "Live results, group rankings, knockout bracket, and tiebreakers.",
  stats: [
    { label: "Entries", value: 24 },
    { label: "Current Leader", value: "Jake" },
    { label: "Prize Pool", value: "£480" },
    { label: "Updated", value: "Sample data" }
  ],
  leaderboard: [
    { name: "Jake", total: 182, perfect: 4, excellent: 9, good: 12, groups: 96, knockout: 86 },
    { name: "Mia", total: 177, perfect: 3, excellent: 10, good: 11, groups: 94, knockout: 83 },
    { name: "Sam", total: 170, perfect: 2, excellent: 11, good: 12, groups: 89, knockout: 81 },
    { name: "Noah", total: 166, perfect: 2, excellent: 9, good: 13, groups: 91, knockout: 75 }
  ],
  groups: [
    { name: "Group A", rows: [
      ["1. Spain", "14 pts"], ["2. Croatia", "12 pts"], ["3. Canada", "9 pts"], ["4. Algeria", "4 pts"]
    ]},
    { name: "Group B", rows: [
      ["1. Brazil", "13 pts"], ["2. England", "11 pts"], ["3. Turkey", "8 pts"], ["4. Ghana", "3 pts"]
    ]},
    { name: "Group C", rows: [
      ["1. Argentina", "15 pts"], ["2. France", "12 pts"], ["3. Mexico", "7 pts"], ["4. Tunisia", "2 pts"]
    ]},
    { name: "Group D", rows: [
      ["1. Portugal", "13 pts"], ["2. Netherlands", "10 pts"], ["3. Japan", "8 pts"], ["4. New Zealand", "1 pt"]
    ]}
  ],
  bracket: [
    { round: "Round of 32", matches: [
      ["Spain", "Canada"], ["Brazil", "Turkey"], ["Argentina", "Mexico"], ["Portugal", "Japan"]
    ]},
    { round: "Round of 16", matches: [
      ["Spain", "Brazil"], ["Argentina", "Portugal"]
    ]},
    { round: "Quarterfinals", matches: [
      ["Spain", "Argentina"]
    ]},
    { round: "Semifinals", matches: [
      ["Spain", "France"]
    ]},
    { round: "Final", matches: [
      ["Spain", "Spain"]
    ]}
  ],
  tiebreakers: [
    "Most perfect groups",
    "Most excellent groups",
    "Most good groups",
    "Most exact team placements",
    "Correct champion",
    "Closest final score prediction"
  ],
  scoring: [
    { title: "Group order", text: "Exact position = 4, off by 1 = 1, off by 2+ = 0." },
    { title: "Bonuses", text: "Correct top 2 teams = +2, perfect group = +4." },
    { title: "Knockouts", text: "Use your odds-weighted round scoring for the bracket." }
  ],
  results: [
    { time: "Today", title: "Leaderboard updated", text: "Jake moves back into first after a strong semifinal round." },
    { time: "Yesterday", title: "Group stage locked", text: "All group predictions are final and scoring is complete." },
    { time: "Yesterday", title: "Next update", text: "Quarterfinal results will refresh the bracket table automatically." }
  ]
};
