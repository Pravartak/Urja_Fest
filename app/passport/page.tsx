'use client'

import { useState } from 'react'

export default function PassportPage() {
  const [ccCode, setCcCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Does nothing - just as requested
  }

  return (
    <div className="page-container">
      <div className="passport-container">
        <div className="passport-card">
          <h1 className="passport-title">CC PASSPORT</h1>
          <p className="passport-subtitle">Enter your Community Champion Code</p>
          
          <form onSubmit={handleSubmit} className="passport-form">
            <div className="form-group">
              <label htmlFor="ccCode" className="form-label">
                CC Code
              </label>
              <input
                type="text"
                id="ccCode"
                value={ccCode}
                onChange={(e) => setCcCode(e.target.value)}
                placeholder="Enter your CC Code"
                className="form-input"
              />
            </div>

            <button type="submit" className="submit-btn">
              SUBMIT
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          margin-top: 80px;
        }

        .passport-container {
          width: 100%;
          max-width: 500px;
        }

        .passport-card {
          background: rgba(20, 10, 40, 0.8);
          border: 2px solid #d4af37;
          border-radius: 12px;
          padding: 40px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
        }

        .passport-title {
          font-size: 32px;
          font-weight: bold;
          color: #d4af37;
          text-align: center;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .passport-subtitle {
          color: #b0b0b0;
          text-align: center;
          margin-bottom: 30px;
          font-size: 14px;
        }

        .passport-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          color: #d4af37;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .form-input {
          padding: 12px 16px;
          border: 1px solid #d4af37;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .form-input::placeholder {
          color: #666666;
        }

        .form-input:focus {
          outline: none;
          border-color: #ff1493;
          box-shadow: 0 0 10px rgba(255, 20, 147, 0.3);
          background: rgba(255, 255, 255, 0.1);
        }

        .submit-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #d4af37, #ff1493);
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(212, 175, 55, 0.4);
        }

        .submit-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
}
