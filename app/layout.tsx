import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Corrente do Bem',
  description: 'Campanha de arrecadação solidária.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
