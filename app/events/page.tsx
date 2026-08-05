import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const events = [
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
