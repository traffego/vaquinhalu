'use client'
import Link from 'next/link'

export default function DoacaoPendente() {
  return (
    <div className="result-page">
      <div className="result-card" style={{ borderTopColor: 'var(--gold)' }}>
        <span className="result-icon" style={{ fontSize: '2.5rem' }}>⏳</span>
        <h2 className="result-title">Pagamento em análise</h2>
        <p className="result-text">
          Sua contribuição está sendo processada. Assim que confirmada, o valor será contabilizado na campanha.
          Você receberá uma notificação por e-mail.
        </p>
        <Link href="/" className="btn btn-primary btn-full">
          Voltar para a campanha
        </Link>
      </div>
    </div>
  )
}
