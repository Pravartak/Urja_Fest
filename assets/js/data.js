// Static mirror of the site data (originally from lib/db.json).
// Used to render events, leaderboard, gallery, sponsors without a server.
window.URJA_DATA = {
  fest: {
    name: "URJA",
    tagline: "The Legacy Begins Here.",
    eventDate: "2026-12-18T09:00:00",
    totalEvents: 9,
    totalDays: 3,
    contingents: 19
  },
  events: {
    "Day 1 - Sports & Mgmt": [
      { name: "Deadly Yorker", tag: "sports", desc: "A thrilling knockout cricket battle testing teamwork and strategy.", time: "TBD", venue: "Turf", team: "5-11", prize: "Cert & Prizes", status: "open" },
      { name: "Real Cricket - Finals", tag: "tech", desc: "Virtual cricket showdown for the sharpest thumbs on campus.", time: "TBD", venue: "Class", team: "1", prize: "Cert & Prizes", status: "closed" },
      { name: "Final Breath", tag: "sports", desc: "An endurance challenge that pushes competitors to their limit.", time: "TBD", venue: "Class", team: "1", prize: "Cert & Prizes", status: "open" },
      { name: "FinTech Case", tag: "mgmt", desc: "Crack real-world finance case studies against the clock.", time: "TBD", venue: "Class", team: "1-2", prize: "Cert & Prizes", status: "open" },
      { name: "Mystimoney", tag: "mgmt", desc: "A money-management simulation testing quick decision making.", time: "TBD", venue: "Class", team: "1-2", prize: "Cert & Prizes", status: "open" }
    ],
    "Day 2 - Management": [
      { name: "Ad-Mad Show", tag: "mgmt", desc: "Improvise a jingle-fuelled ad campaign live on stage.", time: "TBD", venue: "Auditorium", team: "4-6", prize: "Cert & Prizes", status: "open" },
      { name: "Biz Quiz", tag: "mgmt", desc: "A rapid-fire quiz on business, markets and current affairs.", time: "TBD", venue: "Class", team: "2", prize: "Cert & Prizes", status: "open" }
    ],
    "Day 3 - Cultural": [
      { name: "Battle of Bands", tag: "cultural", desc: "Live bands go head to head for cosmic glory.", time: "TBD", venue: "Auditorium", team: "3-8", prize: "Cert & Prizes", status: "open" },
      { name: "Solo Dance", tag: "cultural", desc: "One dancer, one stage, one shot at the crown.", time: "TBD", venue: "Auditorium", team: "1", prize: "Cert & Prizes", status: "open" }
    ]
  },
  leaderboard: [
    { name: "CC Andhadhun", points: 375 },
    { name: "CC 13B", points: 250 },
    { name: "CC Evaru", points: 200 },
    { name: "CC Maayavan", points: 180 }
  ],
  gallery: [
    { url: "", caption: "Campus stalls" },
    { url: "", caption: "Opening ceremony" },
    { url: "", caption: "Audience" }
  ],
  sponsors: { title: [], gold: [], silver: [] }
};
