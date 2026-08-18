import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const events = [ // Mock data (wrong format). Not gonna be used
  {
    id: 1,
    title: 'Deadly Yorker',
    description: 'A thrilling knockout cricket battle testing teamwork and strategy.',
    category: 'SPORTS',
    tag: 'sports',
    date: 'TBD',
    location: 'Turf',
    prizes: 'Cert & Prizes',
  },
  {
    id: 2,
    title: 'Code Clash',
    description: 'Competitive programming tournament for coding enthusiasts.',
    category: 'TECH',
    tag: 'tech',
    date: 'TBD',
    location: 'Lab',
    prizes: 'Cert & Prizes',
  },
  {
    id: 3,
    title: 'Art Exhibition',
    description: 'Showcase of artistic talents and creative expressions.',
    category: 'CULTURAL',
    tag: 'cultural',
    date: 'TBD',
    location: 'Hall',
    prizes: 'Cert & Prizes',
  },
  {
    id: 4,
    title: 'Business Hunt',
    description: 'Strategic case study competition for management minds.',
    category: 'MANAGEMENT',
    tag: 'mgmt',
    date: 'TBD',
    location: 'Room',
    prizes: 'Cert & Prizes',
  },
  {
    id: 5,
    title: 'Sports Relay',
    description: 'Fast-paced team relay race combining speed and coordination.',
    category: 'SPORTS',
    tag: 'sports',
    date: 'TBD',
    location: 'Track',
    prizes: 'Cert & Prizes',
  },
  {
    id: 6,
    title: 'Tech Innovation',
    description: 'Ideas pitch competition for innovative tech solutions.',
    category: 'TECH',
    tag: 'tech',
    date: 'TBD',
    location: 'Auditorium',
    prizes: 'Cert & Prizes',
  },
]

const eEvents = [ // Correct format for events, but still mock data. Not gonna be used
  {
    eventId: 1,
    title: "Literature Arts",
    description: "A celebration of literary and artistic expression, featuring competitions and showcases.",
    venue: "Bakliwal Foundation College",
    date: "10-26-2026",
    time: "11AM Onwards",
  },
  {
    eventId: 2,
    title: "Fine Arts",
    description: "An exhibition of visual arts, including painting, sculpture, and photography.",
    venue: "Bakliwal Foundation College",
    date: "10-26-2026",
    time: "11AM Onwards",
  },
  {
    eventId: 3,
    title: "Solo Performances",
    description: "A showcase of individual talents in music, dance, and drama.",
    venue: "Bakliwal Foundation College",
    date: "10-26-2026",
    time: "11AM Onwards",
  },
  {
    eventId: 4,
    title: "Band Performances",
    description: "A series of live band performances featuring various genres of music.",
    venue: "Bakliwal Foundation College",
    date: "10-26-2026",
    time: "11AM Onwards",
  }
];

export default function Events() {
  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        <section className="events-hero">
          <h1 className="hero-title" data-text="Events">Events</h1>
          <p className="hero-tagline">Explore all the events taking place during URJA.</p>
        </section>

        <section className="section">
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <span className={`event-tag ${event.tag}`}>
                  📌 {event.category}
                </span>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <div className="event-meta">
                  <span>📍 {event.location}</span>
                  <span>🏆 {event.prizes}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
