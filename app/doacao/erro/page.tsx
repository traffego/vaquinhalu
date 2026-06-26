'use client'
import Link from 'next/link'

export default function DoacaoErro() {
  return (
    <div className="result-page">
      <div className="result-card" style={{ borderTopColor: '#991b1b' }}>
        <span className="result-icon" style={{ fontSize: '2.5rem' }}>✕</span>
        <h2 className="result-title">Não foi possível processar</h2>
        <p className="result-text">
          Houve um problema ao processar seu pagamento. Nenhum valor foi cobrado.
          Por favor, tente novamente ou utilize outro método de pagamento.
        </p>
        <Link href="/" className="btn btn-primary btn-full">
          Tentar novamente
        </Link>
      </div>
    </div>
  )
}
