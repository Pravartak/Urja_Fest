import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'URJA | The Legacy Begins Here',
  description: 'URJA - The annual fest of Bakliwal Foundation College',
  verification: {
    google: "-oq_CPL62vfzmoObPidFEE54sCgsqflg1yAAoDB2U3Y"
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Analytics />
      <body>{children}</body>
    </html>
  )
}
