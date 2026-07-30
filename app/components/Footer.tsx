import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <h4 className="hero-title" style={{ fontSize: '1.5rem', letterSpacing: '3px' }}>⚡URJA</h4>
          <p className="hero-tagline">The Legacy Begins Here</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/events">Events</Link></li>
            <li><Link href="/register">Register</Link></li>
          </ul>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><Link href="/leaderboard">Leaderboard</Link></li>
            <li><Link href="/gallery">Gallery</Link></li>
            <li><Link href="/sponsors">Sponsors</Link></li>
          </ul>
        </div>
        <div>
          <h4>Connect</h4>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Follow us on Instagram<br />
            <a style={{ color: 'var(--gold)' }} href="https://www.instagram.com/bakliwal_.computerassociation">
              @bakliwal_.computerassociation
            </a>
          </p>
        </div>
      </div>
      <div className="footer-bottom">&copy; 2026 URJA. All Rights Reserved.</div>
    </footer>
  )
}
