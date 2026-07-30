import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function About() {
  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        <section className="about-hero">
          <h1 className="hero-title">Our Story</h1>
          <p className="hero-tagline">The Journey of URJA</p>
        </section>

        <section className="section">
          <h2 className="section-title">Where Innovation meets Art</h2>
          <p className="lede" style={{ margin: '0 auto' }}>
            This festival marks the convergence of five distinguished events — Prodigy, Epitome, Technotronix, Mebido, and Ignite — each of which has, over the years, cultivated its own unique identity and legacy. Prodigy represented the pursuit of excellence, Ignite embodied the spark of inspiration, Mebido showcased creative ingenuity, Epitome stood for the highest standards of achievement, and Technotronix celebrated technological advancement.
          </p>
          <p className="lede" style={{ margin: '24px auto 0' }}>
            With the conclusion of their journeys, these festivals have united to form a singular, comprehensive celebration. This new chapter is built upon their collective heritage, bringing together diverse disciplines, talents, and aspirations under one banner.
          </p>
        </section>
      </div>

      <Footer />
    </>
  )
}
