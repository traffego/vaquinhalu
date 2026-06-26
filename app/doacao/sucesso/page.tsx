'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  return (
    <div className="result-page">
      <div className="result-card">
        <span className="result-icon">✓</span>
        <h2 className="result-title">Contribuição confirmada</h2>
        <p className="result-text">
          Sua doação foi recebida com sucesso. A Lucianinha ficará muito grata pelo seu gesto solidário.
          Um e-mail de confirmação será enviado em breve.
        </p>
        <Link href="/" className="btn btn-primary btn-full">
          Voltar para a campanha
        </Link>
      </div>
    </div>
  )
}

export default function DoacaoSucesso() {
  return (
    <Suspense fallback={
      <div className="result-page">
        <div className="result-card">
          <span className="result-icon">⏳</span>
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
