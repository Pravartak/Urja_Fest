import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'URJA | The Legacy Begins Here',
  description: 'URJA - The annual fest of Bakliwal Foundation College',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
