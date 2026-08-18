'use client'

import Link from 'next/link'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { useEffect, useState } from 'react'

export default function Home() {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const updateCountdown = () => {
      const eventDate = new Date(2026, 10, 30, 0, 0, 0).getTime()
      const now = new Date().getTime()
      const distance = eventDate - now

      if (distance > 0) {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((distance / 1000 / 60) % 60),
          seconds: Math.floor((distance / 1000) % 60),
        })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        <section className="hero">
          {/* <video autoPlay muted loop className="hero-logo">
            <source src="/urja-logo.mp4" type="video/mp4" />
          </video> */}
          <h1 className='hero-title' data-text="URJA">URJA</h1>
          <p className="hero-tagline">The Legacy Begins Here.</p>

          <div className="countdown">
            <div className="count-box">
              <div className="num">{String(countdown.days).padStart(2, '0')}</div>
              <div className="lbl">DAYS</div>
            </div>
            <div className="count-box">
              <div className="num">{String(countdown.hours).padStart(2, '0')}</div>
              <div className="lbl">HOURS</div>
            </div>
            <div className="count-box">
              <div className="num">{String(countdown.minutes).padStart(2, '0')}</div>
              <div className="lbl">MINUTES</div>
            </div>
            <div className="count-box">
              <div className="num">{String(countdown.seconds).padStart(2, '0')}</div>
              <div className="lbl">SECONDS</div>
            </div>
          </div>

          <div className="hero-ctas">
            <Link href="/events" className="btn btn-gold">
              Explore Events →
            </Link>
            <Link href="/register" className="btn btn-ghost">
              👥 Register Now
            </Link>
          </div>

          <div className="hero-meta">
            <span>⚡ 35 Events</span>
            <span>3 Days of Cosmic Adrenaline</span>
          </div>
        </section>

        <section className="section" style={{ textAlign: 'center' }}>
          <h2 className="basic-heading">
            Where <span className="accent">Innovation</span> meets Art
          </h2>
          <p className="lede" style={{ margin: '0 auto' }}>
            This festival marks the convergence of five distinguished events — Prodigy, Epitome, Technotronix, Mebido, and Ignite — each of which has, over the years, cultivated its own unique identity and legacy. With the conclusion of their journeys, these festivals have united to form a singular, comprehensive celebration.
          </p>
          <Link href="/about" style={{ display: 'inline-block', marginTop: '26px', color: 'var(--gold)', fontWeight: '700', letterSpacing: '1px' }}>
            READ OUR STORY →
          </Link>
        </section>

        <section className="section">
          <div className="grid-3">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Dynamic Events</h3>
              <p>35+ events across Sports, Cultural, Tech & Management. Three days of cosmic adrenaline.</p>
              <Link href="/events" className="discover">
                DISCOVER →
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Live Leaderboards</h3>
              <p>Real-time PR points tracking across 19 contingents. The galaxy awaits its champion.</p>
              <Link href="/leaderboard" className="discover">
                DISCOVER →
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🖼️</div>
              <h3>Visual Spectacles</h3>
              <p>A curated gallery of the finest cosmic moments captured at URJA.</p>
              <Link href="/gallery" className="discover">
                DISCOVER →
              </Link>
            </div>
          </div>

          <div className="stats-strip">
            <div>
              <div className="num">35+</div>
              <div className="lbl">EVENTS</div>
            </div>
            <div>
              <div className="num">3</div>
              <div className="lbl">DAYS</div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
