import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Corrente do Bem – Ajude a Lucianinha',
  description: 'Juntos podemos ajudar a Lucianinha a realizar sua cirurgia e voltar a sorrir. Faça sua doação agora e seja parte dessa corrente do bem.',
  keywords: ['doação', 'solidariedade', 'ajuda', 'cirurgia', 'corrente do bem'],
  openGraph: {
    title: 'Corrente do Bem – Ajude a Lucianinha',
    description: 'Faça parte dessa corrente de amor e solidariedade. Cada doação faz diferença!',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
