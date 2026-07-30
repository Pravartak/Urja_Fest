import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const leaderboard = [
  { rank: 1, name: 'Contingent A', points: 4250 },
  { rank: 2, name: 'Contingent B', points: 3980 },
  { rank: 3, name: 'Contingent C', points: 3750 },
  { rank: 4, name: 'Contingent D', points: 3450 },
  { rank: 5, name: 'Contingent E', points: 3200 },
  { rank: 6, name: 'Contingent F', points: 2950 },
  { rank: 7, name: 'Contingent G', points: 2700 },
  { rank: 8, name: 'Contingent H', points: 2450 },
  { rank: 9, name: 'Contingent I', points: 2150 },
  { rank: 10, name: 'Contingent J', points: 1900 },
]

export default function Leaderboard() {
  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        <section className="leaderboard-hero">
          <h1 className="basic-heading">Leaderboard</h1>
          <p className="hero-tagline">Real-time rankings for all contingents</p>
        </section>

        <section className="section">
          <h2 className="section-title">Top Performers</h2>

          <div className="podium">
            {leaderboard.slice(0, 3).map((entry) => (
              <div key={entry.rank} className={`podium-card ${entry.rank === 1 ? 'first' : ''}`}>
                <h3>🥇 #{entry.rank}</h3>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>{entry.name}</h4>
                <div className="pts">{entry.points}</div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '10px' }}>Points</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '60px' }}>
            <h3 className="section-title">Full Rankings</h3>
            <div className="lb-list">
              {leaderboard.map((entry) => (
                <div key={entry.rank} className="lb-row">
                  <div className="lb-rank">#{entry.rank}</div>
                  <div className="lb-name">{entry.name}</div>
                  <div style={{ flex: 1, marginLeft: '20px' }}>
                    <div className="lb-bar" style={{ width: `${(entry.points / 4250) * 100}%` }}></div>
                  </div>
                  <div className="lb-pts">{entry.points}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
