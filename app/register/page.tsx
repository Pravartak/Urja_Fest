'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    contingent: '',
    eventCategory: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    setSubmitted(true)
    console.log('Form submitted:', formData)
    setTimeout(() => {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        contingent: '',
        eventCategory: '',
      })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        <section className="register-hero">
          <div className="eyebrow">🚀 JOIN THE MISSION</div>
          <h1 className="hero-title">REGISTER</h1>
          <p className="hero-tagline">Be part of the cosmic experience. Register now!</p>
        </section>

        <section className="section">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {submitted ? (
              <div style={{
                background: 'rgba(80, 220, 140, 0.15)',
                border: '1px solid rgba(80, 220, 140, 0.5)',
                borderRadius: '18px',
                padding: '40px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✅</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--gold)' }}>Registration Successful!</h3>
                <p style={{ color: 'var(--text-dim)' }}>Welcome to URJA 2026! Check your email for confirmation details.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '40px',
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '1.5px' }}>
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '14px 16px',
                      border: '1px solid var(--border)',
                      background: 'rgba(0,0,0,0.3)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '1.5px' }}>
                    EMAIL
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '14px 16px',
                      border: '1px solid var(--border)',
                      background: 'rgba(0,0,0,0.3)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '1.5px' }}>
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 XXXXXXXXXX"
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '14px 16px',
                      border: '1px solid var(--border)',
                      background: 'rgba(0,0,0,0.3)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '1.5px' }}>
                    CONTINGENT
                  </label>
                  <select
                    name="contingent"
                    value={formData.contingent}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '14px 16px',
                      border: '1px solid var(--border)',
                      background: 'rgba(0,0,0,0.3)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="">Select your contingent</option>
                    <option value="A">Contingent A</option>
                    <option value="B">Contingent B</option>
                    <option value="C">Contingent C</option>
                    <option value="D">Contingent D</option>
                  </select>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '1.5px' }}>
                    EVENT CATEGORY
                  </label>
                  <select
                    name="eventCategory"
                    value={formData.eventCategory}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '14px 16px',
                      border: '1px solid var(--border)',
                      background: 'rgba(0,0,0,0.3)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="">Select interest</option>
                    <option value="sports">Sports</option>
                    <option value="tech">Tech</option>
                    <option value="cultural">Cultural</option>
                    <option value="management">Management</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Register Now
                </button>

                <p style={{ marginTop: '24px', maxWidth: '100%', color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center' }}>
                  By registering, you agree to participate in URJA 2026 events.
                </p>
              </form>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
