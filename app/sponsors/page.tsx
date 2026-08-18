import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Sponsors() {
  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        <section className="sponsors-hero">
          <h1 className="hero-title" data-text="Sponsors">Sponsors</h1>
          <p className="hero-tagline">Our partners and supporters</p>
        </section>

        <section className="section">
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <div style={{
              borderRadius: '20px',
              textAlign: 'center',
              padding: '100px 24px',
              border: '1px dashed var(--border)',
              background: 'rgba(0,0,0,0.1)',
            }}>
              <div style={{ marginBottom: '20px', fontSize: '3rem' }}>🎯</div>
              <h3 style={{ marginBottom: '12px', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
                Sponsorship Opportunities
              </h3>
              <p style={{ color: 'var(--text-dim)' }}>
                Join us in making URJA 2026 an unforgettable experience. Contact us for partnership opportunities.
              </p>
              <p style={{ color: 'var(--text-dim)', marginTop: '20px', fontSize: '0.9rem' }}>
                Email: info@urjafest.com
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
