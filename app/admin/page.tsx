'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const mockRegistrations = [
  { id: 1, name: 'John Doe', email: 'john@example.com', contingent: 'A', category: 'Sports' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', contingent: 'B', category: 'Tech' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', contingent: 'A', category: 'Cultural' },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', contingent: 'C', category: 'Management' },
]

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = (e: any) => {
    e.preventDefault()
    if (password === 'admin123') {
      setIsLoggedIn(true)
      setErrorMsg('')
    } else {
      setErrorMsg('Invalid password')
      setPassword('')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setPassword('')
    setErrorMsg('')
  }

  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        {!isLoggedIn ? (
          <section className="register-hero" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ maxWidth: '420px', margin: '0 auto', width: '100%', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{
                  display: 'flex',
                  height: '90px',
                  width: '90px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                  fontSize: '2.2rem',
                  boxShadow: '0 0 60px rgba(232,69,184,0.35)',
                  margin: '0 auto 24px',
                }}>
                  🔐
                </div>
                <h1 className="hero-title" style={{ fontSize: '2.2rem' }}>
                  Admin Panel
                </h1>
              </div>

              <form onSubmit={handleLogin} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '36px',
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '1.5px' }}>
                    ADMIN PASSWORD
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
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

                {errorMsg && (
                  <div style={{
                    marginBottom: '20px',
                    background: 'rgba(255, 100, 100, 0.1)',
                    border: '1px solid rgba(255, 100, 100, 0.5)',
                    borderRadius: '10px',
                    padding: '12px',
                    color: '#ff6464',
                    fontSize: '0.9rem',
                  }}>
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-purple-gradient"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Login
                </button>

                <p style={{ marginTop: '24px', color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center' }}>
                  Hint: Use admin123
                </p>
              </form>
            </div>
          </section>
        ) : (
          <>
            <section className="section" style={{ marginTop: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 className="hero-title" style={{ fontSize: '2rem' }}>
                  Dashboard
                </h1>
                <button
                  onClick={handleLogout}
                  className="btn btn-gold"
                >
                  Logout
                </button>
              </div>

              <div style={{
                display: 'grid',
                gap: '24px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                marginBottom: '60px',
              }}>
                <div className="feature-card">
                  <div className="feature-icon">👥</div>
                  <h3>Total Registrations</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gold)', marginTop: '10px' }}>
                    {mockRegistrations.length}
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📅</div>
                  <h3>Active Events</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gold)', marginTop: '10px' }}>
                    6
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🏆</div>
                  <h3>Contingents</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gold)', marginTop: '10px' }}>
                    4
                  </div>
                </div>
              </div>

              <h2 className="section-title">Recent Registrations</h2>

              <div style={{
                overflowX: 'auto',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '18px',
                marginTop: '30px',
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-dim)' }}>NAME</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-dim)' }}>EMAIL</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-dim)' }}>CONTINGENT</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-dim)' }}>CATEGORY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRegistrations.map((reg) => (
                      <tr key={reg.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 24px', color: 'var(--text)' }}>{reg.name}</td>
                        <td style={{ padding: '14px 24px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>{reg.email}</td>
                        <td style={{ padding: '14px 24px' }}>
                          <span style={{
                            display: 'inline-block',
                            background: 'rgba(232,194,106,0.15)',
                            color: 'var(--gold)',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}>
                            {reg.contingent}
                          </span>
                        </td>
                        <td style={{ padding: '14px 24px', color: 'var(--text-dim)' }}>{reg.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      <Footer />
    </>
  )
}
