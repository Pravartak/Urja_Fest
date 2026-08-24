import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

type Team = {
  name: string
  captain: string
  participants: number
  points: number
  events: string[]
}

const colleges: Record<string, { name: string; code: string; city: string; description: string; teams: Team[] }> = {
  bfc: {
    name: 'Bakliwal Foundation College',
    code: 'BFC',
    city: 'Pune, Maharashtra',
    description: 'A community of curious builders, bold performers, and spirited competitors representing BFC at URJA.',
    teams: [
      { name: 'The Trailblazers', captain: 'Aarav Kulkarni', participants: 8, points: 128, events: ['Code Clash', 'Tech Innovation', 'Sports Relay'] },
      { name: 'Pixel Pioneers', captain: 'Ira Shah', participants: 6, points: 96, events: ['Art Exhibition', 'Tech Innovation'] },
      { name: 'Velocity', captain: 'Rohan Patil', participants: 10, points: 84, events: ['Deadly Yorker', 'Sports Relay'] },
      { name: 'The Strategists', captain: 'Meera Joshi', participants: 5, points: 61, events: ['Business Hunt'] },
    ],
  },
  mit: {
    name: 'Maharashtra Institute of Technology',
    code: 'MIT',
    city: 'Pune, Maharashtra',
    description: 'MIT arrives at URJA with an ambitious mix of technical talent and competitive energy.',
    teams: [
      { name: 'Binary Beasts', captain: 'Kabir More', participants: 7, points: 112, events: ['Code Clash', 'Tech Innovation'] },
      { name: 'Apex United', captain: 'Sana Khan', participants: 9, points: 73, events: ['Deadly Yorker', 'Sports Relay'] },
    ],
  },
}

const eventDetails: Record<string, { category: string; date: string }> = {
  'Deadly Yorker': { category: 'SPORTS', date: 'OCT 26' },
  'Code Clash': { category: 'TECH', date: 'OCT 26' },
  'Art Exhibition': { category: 'CULTURAL', date: 'OCT 26' },
  'Business Hunt': { category: 'MANAGEMENT', date: 'OCT 26' },
  'Sports Relay': { category: 'SPORTS', date: 'OCT 27' },
  'Tech Innovation': { category: 'TECH', date: 'OCT 27' },
}

export default async function CollegePage({ params }: { params: Promise<{ clcode: string }> }) {
  const { clcode } = await params
  const college = colleges[clcode.toLowerCase()] ?? colleges.bfc
  const participantCount = college.teams.reduce((total, team) => total + team.participants, 0)
  const totalPoints = college.teams.reduce((total, team) => total + team.points, 0)
  const eventCount = new Set(college.teams.flatMap((team) => team.events)).size

  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />
      <main className="page-wrap college-dashboard">
        <section className="college-hero section">
          <div className="college-identity">
            <div className="college-mark" aria-hidden="true">{college.code.slice(0, 2)}</div>
            <div>
              <p className="eyebrow">COLLEGE PROFILE / {college.code}</p>
              <h1>{college.name}</h1>
              <p className="college-location">{college.city} · URJA 2026 delegate hub</p>
            </div>
          </div>
          <p className="college-description">{college.description}</p>
          <Link className="btn btn-ghost" href="/events">View all URJA events <span aria-hidden="true">→</span></Link>
        </section>

        <section className="college-stats section" aria-label="College statistics">
          <div className="college-stat"><span className="stat-label">TEAMS</span><strong>{college.teams.length}</strong><span>competing squads</span></div>
          <div className="college-stat"><span className="stat-label">PARTICIPANTS</span><strong>{participantCount}</strong><span>registered students</span></div>
          <div className="college-stat"><span className="stat-label">PR POINTS</span><strong>{totalPoints}</strong><span>earned so far</span></div>
          <div className="college-stat"><span className="stat-label">EVENTS</span><strong>{eventCount}</strong><span>events entered</span></div>
        </section>

        <section className="college-content section">
          <div className="section-heading-row">
            <div><p className="eyebrow">ON THE CIRCUIT</p><h2>Team performance</h2></div>
            <span className="live-pill"><span /> LIVE STANDINGS</span>
          </div>
          <div className="team-list">
            {college.teams.sort((a, b) => b.points - a.points).map((team, index) => (
              <article className="team-row" key={team.name}>
                <div className="team-rank">{String(index + 1).padStart(2, '0')}</div>
                <div className="team-main"><h3>{team.name}</h3><p>Captain: {team.captain} · {team.participants} participants</p><div className="team-events">{team.events.map((event) => <span key={event}>{event}</span>)}</div></div>
                <div className="team-points"><strong>{team.points}</strong><span>PR POINTS</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className="college-events section">
          <div className="section-heading-row"><div><p className="eyebrow">EVENT MAP</p><h2>Where they compete</h2></div><Link href="/events" className="text-link">Browse schedule →</Link></div>
          <div className="college-event-grid">
            {Array.from(new Set(college.teams.flatMap((team) => team.events))).map((event) => <div className="college-event-card" key={event}><div><span>{eventDetails[event].category}</span><h3>{event}</h3></div><time>{eventDetails[event].date}</time></div>)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
