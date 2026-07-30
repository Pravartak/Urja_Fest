import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Gallery() {
  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        <section className="gallery-hero">
          <div className="eyebrow">🎬 COSMIC MEMORIES</div>
          <h1 className="hero-title">GALLERY</h1>
          <p className="hero-tagline">A curated gallery of the finest cosmic moments captured at URJA.</p>
        </section>

        <section className="section">
          <div className="gallery-grid">
            <div className="gallery-item">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '280px',
                background: 'linear-gradient(135deg, rgba(122,63,228,0.3), rgba(232,69,184,0.2))',
                borderRadius: '1rem',
                fontSize: '3rem'
              }}>
                📸
              </div>
            </div>
            <div className="gallery-item">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '280px',
                background: 'linear-gradient(135deg, rgba(232,194,106,0.2), rgba(122,63,228,0.2))',
                borderRadius: '1rem',
                fontSize: '3rem'
              }}>
                🎉
              </div>
            </div>
            <div className="gallery-item">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '280px',
                background: 'linear-gradient(135deg, rgba(232,69,184,0.2), rgba(122,63,228,0.3))',
                borderRadius: '1rem',
                fontSize: '3rem'
              }}>
                🏆
              </div>
            </div>
          </div>

          <div style={{ marginTop: '80px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>
              Gallery coming soon! Stay tuned for epic moments from URJA 2026.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
