'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <Link href="/" className="brand">
        <span>⚡URJA</span>
      </Link>
      <div className="nav-links">
        <Link href="/" className={isActive('/')}>
          HOME
        </Link>
        <Link href="/about" className={isActive('/about')}>
          ABOUT
        </Link>
        <Link href="/events" className={isActive('/events')}>
          EVENTS
        </Link>
        <Link href="/register" className={isActive('/register')}>
          REGISTER
        </Link>
        <Link href="/leaderboard" className={isActive('/leaderboard')}>
          LEADERBOARD
        </Link>
        <Link href="/gallery" className={isActive('/gallery')}>
          GALLERY
        </Link>
        <Link href="/sponsors" className={isActive('/sponsors')}>
          SPONSORS
        </Link>
        <Link href="/passport" className={`passport ${isActive('/passport')}`}>
          CC PASSPORT
        </Link>
      </div>
    </nav>
  )
}
