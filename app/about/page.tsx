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
          <h1 className="hero-title" data-text="About URJA">About URJA</h1>
        </section>

        <section className="section">
          <h2 className="basic-heading">Where Innovation meets Art</h2>
          <p className="lede" style={{ margin: '0 auto' }}>
            URJA is the annual fest of Bakliwal Foundation College of Arts, Commerce and Science, Vashi, where innovation meets art. Over four days, students from colleges across the region come together to compete in cultural, sports, technical and management events, from literature, fine arts and solo performances to big group showcases on the main day.
          </p>
          <p className="lede" style={{ margin: '24px auto 0' }}>
            URJA is more than a fest. It’s a stage for talent, ideas and competition. The Legacy Begins Here.
          </p>
        </section>
      </div>

      <Footer />
    </>
  )
}
