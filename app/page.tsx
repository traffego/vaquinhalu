'use client'

import { useState, useEffect, useRef } from 'react'

interface Campaign {
  name: string
  goal_amount: number
  story_title: string
  story_text: string
  hero_image_url: string | null
  cta_text: string
  suggested_values: string
  status: string
}

interface Donation {
  id: string
  donor_name: string
  amount: number
  message: string | null
  anonymous: boolean
  created_at: string
}

interface Stats {
  total: number
  count: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

export default function Home() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<Stats>({ total: 0, count: 0 })
  const [donations, setDonations] = useState<Donation[]>([])
  const [mpMode, setMpMode] = useState('sandbox')

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const donationRef = useRef<HTMLElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [campRes, donaRes, configRes] = await Promise.all([
        fetch('/api/public/campaign'),
        fetch('/api/public/donations'),
        fetch('/api/public/config'),
      ])
      if (campRes.ok) setCampaign(await campRes.json())
      if (donaRes.ok) {
        const d = await donaRes.json()
        setDonations(d.donations || [])
        setStats({ total: d.total || 0, count: d.count || 0 })
      }
      if (configRes.ok) {
        const c = await configRes.json()
        setMpMode(c.mp_mode || 'sandbox')
      }
    } catch (e) { console.error(e) }
  }

  const suggestedValues = campaign?.suggested_values
    ? campaign.suggested_values.split(',').map(Number).filter(Boolean)
    : [10, 25, 50, 100, 200, 500]

  const goalAmount = campaign?.goal_amount || 15000
  const progressPct = Math.min((stats.total / goalAmount) * 100, 100)

  const getAmount = () => {
    if (selectedAmount) return selectedAmount
    if (customAmount) return parseFloat(customAmount.replace(',', '.'))
    return 0
  }

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amount = getAmount()
    if (!amount || amount < 1) { setError('Informe um valor válido (mínimo R$ 1,00)'); return }
    if (!donorName.trim()) { setError('Informe seu nome'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorName, donorEmail, amount, message, anonymous }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao processar doação'); return }

      const url = mpMode === 'sandbox' ? data.sandboxInitPoint : data.initPoint
      if (url) window.location.href = url
      else setError('Gateway de pagamento não configurado. Entre em contato com o administrador.')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!campaign) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-hero)' }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ fontSize: '0.875rem' }}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <nav className="hero-nav">
          <div className="hero-logo">
            <div className="hero-logo-mark">✦</div>
            Corrente do Bem
          </div>
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => donationRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            Fazer uma Doação
          </button>
        </nav>

        <div className="hero-content">
          <div className="hero-inner">
            <div className="hero-text">
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-line" />
                Campanha de Solidariedade
              </div>
              <h1 className="hero-title">
                {campaign.story_title || <>Juntos pela<br /><em>Lucianinha</em></>}
              </h1>
              <p className="hero-subtitle">
                Sua contribuição, independentemente do valor, representa um ato de amor
                que pode transformar a vida de alguém muito especial.
              </p>
              <div className="hero-actions">
                <button
                  className="btn btn-gold btn-lg"
                  onClick={() => donationRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {campaign.cta_text || 'Quero Contribuir'}
                </button>
                <button
                  className="btn btn-outline-light btn-lg"
                  onClick={() => document.getElementById('historia')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Conheça a história
                </button>
              </div>
            </div>

            <div className="hero-photo-wrap">
              <div className="hero-photo-frame">
                <div className="hero-photo-accent" />
                <div className="hero-photo">
                  {campaign.hero_image_url ? (
                    <img src={campaign.hero_image_url} alt="Lucianinha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="hero-photo-placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Foto da Lucianinha</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRESS */}
      <section className="progress-section">
        <div className="container">
          <div className="progress-stats">
            <div style={{ textAlign: 'center' }}>
              <div className="stat-value">{formatCurrency(stats.total)}</div>
              <div className="stat-label">Total arrecadado</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="stat-value">{stats.count}</div>
              <div className="stat-label">Contribuições</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="stat-value">{formatCurrency(goalAmount)}</div>
              <div className="stat-label">Meta da campanha</div>
            </div>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="progress-meta">
            <span>Progresso da arrecadação</span>
            <span className="progress-pct">{progressPct.toFixed(1)}% da meta</span>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="story-section" id="historia">
        <div className="container">
          <div className="story-grid">
            <div className="story-img-wrap">
              <div className="story-img-accent" />
              <div className="story-img">
                {campaign.hero_image_url
                  ? <img src={campaign.hero_image_url} alt="Lucianinha" />
                  : <div className="story-img-placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 64, height: 64 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                }
              </div>
            </div>

            <div className="story-text-content">
              <div className="story-eyebrow">
                <span className="story-eyebrow-line" />
                Nossa história
              </div>
              <h2>Conheça a Lucianinha</h2>
              <div className="story-divider" />
              {(campaign.story_text || '').split('\n').filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <blockquote className="story-quote">
                "Com a sua ajuda, sonhos podem se tornar realidade. Obrigada por fazer parte da nossa corrente do bem."
              </blockquote>
              <button
                className="btn btn-primary mt-4"
                onClick={() => donationRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Fazer minha contribuição
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DONATION FORM */}
      <section className="donation-section" ref={donationRef as React.RefObject<HTMLElement>}>
        <div className="container donation-inner" style={{ textAlign: 'center' }}>
          <div className="donation-eyebrow" style={{ justifyContent: 'center' }}>
            <span className="donation-eyebrow-line" />
            Faça sua contribuição
            <span className="donation-eyebrow-line" />
          </div>
          <h2 className="donation-title">Ajude a Lucianinha</h2>
          <p className="donation-subtitle">
            100% do valor é destinado diretamente à Lucianinha.<br />
            Pagamento processado com segurança pelo MercadoPago.
          </p>

          <div className="donation-form-card">
            <h3>Selecione o valor da contribuição</h3>
            <form onSubmit={handleDonate}>
              <div className="amount-grid">
                {suggestedValues.map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`amount-btn${selectedAmount === val ? ' active' : ''}`}
                    onClick={() => { setSelectedAmount(val); setCustomAmount('') }}
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>

              <div className="form-group amount-custom-wrap" style={{ marginTop: '0.625rem' }}>
                <span className="amount-currency">R$</span>
                <input
                  type="number"
                  className="input amount-custom"
                  placeholder="Outro valor"
                  value={customAmount}
                  min="1"
                  step="0.01"
                  onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label className="label">Nome completo *</label>
                  <input className="input" placeholder="Seu nome" value={donorName} onChange={e => setDonorName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">E-mail</label>
                  <input className="input" type="email" placeholder="seu@email.com" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Mensagem para a Lucianinha (opcional)</label>
                  <textarea
                    className="textarea"
                    placeholder="Deixe uma mensagem de carinho..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    style={{ minHeight: '80px' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textAlign: 'left' }}>
                  <input type="checkbox" id="anon" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} style={{ width: 'auto', accentColor: 'var(--burgundy)' }} />
                  <label htmlFor="anon" style={{ margin: 0, fontWeight: 400, fontSize: '0.875rem', color: 'var(--gray-600)', cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                    Desejo fazer uma contribuição anônima
                  </label>
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading
                  ? 'Processando...'
                  : `Contribuir ${getAmount() > 0 ? formatCurrency(getAmount()) : ''}`
                }
              </button>
              <div className="secure-note">
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Ambiente seguro — dados criptografados pelo MercadoPago
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* DONORS */}
      {donations.length > 0 && (
        <section className="donors-section">
          <div className="container">
            <div className="section-title-wrap">
              <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
                <span className="section-eyebrow-line" />
                Quem já contribuiu
                <span className="section-eyebrow-line" />
              </div>
              <h2>Nossos Apoiadores</h2>
              <p style={{ marginTop: '0.5rem', color: 'var(--gray-400)' }}>Cada contribuição faz a diferença</p>
            </div>
            <div className="donors-grid">
              {donations.map(d => (
                <div key={d.id} className="donor-card">
                  <div className="donor-avatar">
                    {(d.anonymous ? '?' : d.donor_name[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <div className="donor-name">{d.anonymous ? 'Apoiador Anônimo' : d.donor_name}</div>
                    <div className="donor-amount">{formatCurrency(d.amount)}</div>
                    {d.message && <div className="donor-msg">"{d.message}"</div>}
                    <div className="donor-time">{timeAgo(d.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-logo">Corrente do Bem</div>
          <p className="footer-text">Feito com carinho para a Lucianinha. Toda doação conta.</p>
        </div>
      </footer>
    </>
  )
}
