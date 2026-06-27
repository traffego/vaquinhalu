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
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `${mins} min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h atrás`
  return `${Math.floor(hrs / 24)} d atrás`
}

// Máscara simples para WhatsApp: (99) 99999-9999
function maskPhone(v: string) {
  const digits = v.replace(/\D/g, '')
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export default function Home() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, count: 0 })
  const [donations, setDonations] = useState<Donation[]>([])
  
  // Tabs: 'historia' | 'apoiadores'
  const [activeTab, setActiveTab] = useState<'historia' | 'apoiadores'>('historia')

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorPhone, setDonorPhone] = useState('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  
  // Checkout States
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'pix' | 'success'>('form')
  const [qrCode, setQrCode] = useState('')
  const [qrCodeBase64, setQrCodeBase64] = useState('')
  const [currentDonationId, setCurrentDonationId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Slideshow States
  const [currentSlide, setCurrentSlide] = useState(0)

  // Obter array de imagens da campanha
  const getImages = (): string[] => {
    if (!campaign?.hero_image_url) return []
    try {
      const parsed = JSON.parse(campaign.hero_image_url)
      if (Array.isArray(parsed)) return parsed
      return [campaign.hero_image_url]
    } catch {
      return [campaign.hero_image_url]
    }
  }

  const images = getImages()

  // Autoplay para os slides
  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [images])

  useEffect(() => { loadData() }, [])

  // Monitor de status do Pix (Polling)
  useEffect(() => {
    if (checkoutStep !== 'pix' || !currentDonationId) return

    let intervalId: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/status?donationId=${currentDonationId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'approved') {
            setCheckoutStep('success')
            loadData() // Recarrega estatísticas e doações
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status do pagamento:', err)
      }
    }

    // Checa a cada 3 segundos
    intervalId = setInterval(checkStatus, 3000)

    return () => clearInterval(intervalId)
  }, [checkoutStep, currentDonationId])

  async function loadData() {
    try {
      const [campRes, donaRes] = await Promise.allSettled([
        fetch('/api/public/campaign').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/public/donations').then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      if (campRes.status === 'fulfilled' && campRes.value && !campRes.value.error) {
        setCampaign(campRes.value)
      }
      if (donaRes.status === 'fulfilled' && donaRes.value && !donaRes.value.error) {
        const d = donaRes.value
        setDonations(d.donations || [])
        setStats({ total: d.total || 0, count: d.count || 0 })
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e)
    } finally {
      setPageLoading(false)
    }
  }

  const suggestedValues = campaign?.suggested_values
    ? campaign.suggested_values.split(',').map(Number).filter(Boolean)
    : [25, 50, 100, 250]

  const goalAmount = campaign?.goal_amount || 0
  const progressPct = goalAmount > 0 ? Math.min((stats.total / goalAmount) * 100, 100) : 0

  if (pageLoading) return (
    <>
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo"><div className="logo-heart">✦</div>Corrente do Bem</a>
          <a href="/admin/login" className="header-admin-btn">Acesso Restrito</a>
        </div>
      </header>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--vk-gray)', flexDirection: 'column' }}>
        <div className="pix-spinner" style={{ width: 36, height: 36 }} />
        <span style={{ fontSize: '1rem' }}>Carregando campanha...</span>
      </div>
    </>
  )

  if (!campaign) return (
    <>
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo"><div className="logo-heart">✦</div>Corrente do Bem</a>
          <a href="/admin/login" className="header-admin-btn">Acesso Restrito</a>
        </div>
      </header>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem', color: 'var(--vk-gray)', textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem' }}>⚙️</div>
        <h2 style={{ color: 'var(--vk-dark)' }}>Campanha ainda não configurada</h2>
        <p>Acesse o <a href="/admin/campanha" style={{ color: 'var(--vk-green)', fontWeight: 600 }}>painel administrativo</a> para configurar a campanha.</p>
      </div>
    </>
  )

  const getAmount = () => {
    if (selectedAmount) return selectedAmount
    if (customAmount) return parseFloat(customAmount.replace(',', '.'))
    return 0
  }

  async function handleGeneratePix(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amount = getAmount()
    if (!amount || amount < 1) { setError('O valor mínimo de contribuição é R$ 1,00.'); return }
    if (!donorName.trim()) { setError('Preencha seu nome completo.'); return }
    if (donorPhone.replace(/\D/g, '').length < 10) { setError('Digite um número de WhatsApp válido.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName,
          donorPhone,
          amount,
          message,
          anonymous,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao gerar o PIX. Tente novamente mais tarde.')
        return
      }

      setQrCode(data.qrCode)
      setQrCodeBase64(data.qrCodeBase64)
      setCurrentDonationId(data.donationId)
      setCheckoutStep('pix')
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopyPix() {
    if (!qrCode) return
    navigator.clipboard.writeText(qrCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleOpenModal() {
    setCheckoutStep('form')
    setSelectedAmount(25)
    setCustomAmount('')
    setDonorName('')
    setDonorPhone('')
    setMessage('')
    setAnonymous(false)
    setError('')
    setIsModalOpen(true)
  }

  function handleShareLink() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Link da campanha copiado para a área de transferência!')
  }

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo">
            <div className="logo-heart">✦</div>
            Corrente do Bem
          </a>
          <a href="/admin/login" className="header-admin-btn">
            Acesso Restrito
          </a>
        </div>
      </header>

      {/* MAIN WRAPPER */}
      <main className="main-wrapper">
        <div className="campaign-meta-top">
          <span className="campaign-tag">Saúde & Cirurgia</span>
          <span className="campaign-id">Campanha Solidária</span>
        </div>
        
        <h1 className="campaign-title">{campaign.story_title || campaign.name}</h1>

        <div className="campaign-grid">
          {/* LEFT COLUMN: Media, Share, Story & Contributors */}
          <div>
            <div className="media-container">
              {images.length > 0 ? (
                <div className="slider-container">
                  {images.map((url, idx) => (
                    <div
                      key={idx}
                      className={`slide-item${currentSlide === idx ? ' active' : ''}`}
                    >
                      <img src={url} alt={`Foto Lucianinha ${idx + 1}`} />
                    </div>
                  ))}
                  
                  {images.length > 1 && (
                    <>
                      <button
                        className="slider-btn slider-btn-prev"
                        onClick={() => setCurrentSlide(prev => (prev - 1 + images.length) % images.length)}
                        title="Foto anterior"
                      >
                        &#10094;
                      </button>
                      <button
                        className="slider-btn slider-btn-next"
                        onClick={() => setCurrentSlide(prev => (prev + 1) % images.length)}
                        title="Próxima foto"
                      >
                        &#10095;
                      </button>
                      
                      <div className="slider-dots">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            className={`slider-dot${currentSlide === idx ? ' active' : ''}`}
                            onClick={() => setCurrentSlide(idx)}
                            title={`Ir para foto ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="media-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Imagem da Campanha</span>
                </div>
              )}
            </div>

            {/* Share buttons */}
            <div className="share-row">
              <span className="share-label">Compartilhar:</span>
              <a
                href={`https://api.whatsapp.com/send?text=Olá! Veja essa campanha de arrecadação para ajudar na cirurgia da Lucianinha: ${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-btn-whatsapp"
              >
                Compartilhar no WhatsApp
              </a>
              <button onClick={handleShareLink} className="share-btn share-btn-copy">
                Copiar Link
              </button>
            </div>

            {/* Tabs */}
            <div className="tabs-bar">
              <button
                className={`tab-button${activeTab === 'historia' ? ' active' : ''}`}
                onClick={() => setActiveTab('historia')}
              >
                História
              </button>
              <button
                className={`tab-button${activeTab === 'apoiadores' ? ' active' : ''}`}
                onClick={() => setActiveTab('apoiadores')}
              >
                Apoiadores ({stats.count})
              </button>
            </div>

            {/* Tab contents */}
            <div className="story-box">
              {activeTab === 'historia' ? (
                <div className="story-text">
                  {(campaign.story_text || '').split('\n').filter(Boolean).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : (
                <div className="apoiadores-list">
                  {donations.length > 0 ? (
                    donations.map(d => (
                      <div key={d.id} className="apoiador-card">
                        <div className="apoiador-avatar">
                          {(d.anonymous ? '?' : d.donor_name[0] || '?').toUpperCase()}
                        </div>
                        <div className="apoiador-info">
                          <div className="apoiador-nome">{d.anonymous ? 'Apoiador Anônimo' : d.donor_name}</div>
                          <div className="apoiador-valor">Contribuiu com {formatCurrency(d.amount)}</div>
                          {d.message && <div className="apoiador-msg">"{d.message}"</div>}
                          <div className="apoiador-data">{timeAgo(d.created_at)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: 'var(--vk-gray)', padding: '2rem 0' }}>
                      Seja o primeiro a apoiar esta causa! Clique no botão ao lado.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar stats */}
          <aside className="sidebar-sticky">
            <div className="stats-card">
              <div className="arrecadado-label">Arrecadado</div>
              <div className="arrecadado-valor">{formatCurrency(stats.total)}</div>

              <div className="meta-valor">
                Meta de <strong>{formatCurrency(goalAmount)}</strong>
              </div>

              <div className="vk-progress-bar">
                <div className="vk-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>

              <div className="stats-meta-row">
                <span className="stats-meta-pct">{progressPct.toFixed(1)}% alcançado</span>
                <span>{stats.count} contribuições</span>
              </div>

              {/* Falta para a meta */}
              {goalAmount > 0 && stats.total < goalAmount && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(35,170,89,0.08)', border: '1px solid rgba(35,170,89,0.2)',
                  borderRadius: 'var(--radius)', padding: '0.65rem 0.9rem', marginTop: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>🎯</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--vk-gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Falta para a meta</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--vk-green)' }}>
                      {formatCurrency(goalAmount - stats.total)}
                    </div>
                  </div>
                </div>
              )}

              {/* Meta atingida */}
              {goalAmount > 0 && stats.total >= goalAmount && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(35,170,89,0.12)', border: '1px solid var(--vk-green)',
                  borderRadius: 'var(--radius)', padding: '0.65rem 0.9rem', marginTop: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.3rem' }}>🎉</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--vk-green)' }}>
                    Meta atingida! Obrigado!
                  </div>
                </div>
              )}

              <button className="btn-contribuir" onClick={handleOpenModal}>
                {campaign.cta_text || 'Apoiar esta campanha'}
              </button>

              <div className="apoio-extra-box">
                <div className="apoio-extra-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Doação via PIX 100% segura</span>
                </div>
                <div className="apoio-extra-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Todo o valor arrecadado cai direto na conta da cirurgia</span>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Apoiar esta Campanha</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              {checkoutStep === 'form' && (
                <form onSubmit={handleGeneratePix}>
                  <div className="form-group">
                    <label className="label">Selecione o valor do apoio</label>
                    <div className="modal-amount-grid">
                      {suggestedValues.map(val => (
                        <button
                          key={val}
                          type="button"
                          className={`modal-amount-btn${selectedAmount === val ? ' active' : ''}`}
                          onClick={() => { setSelectedAmount(val); setCustomAmount('') }}
                        >
                          R$ {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group amount-custom-wrap">
                    <span className="amount-currency">R$</span>
                    <input
                      type="number"
                      className="input amount-custom"
                      placeholder="Outro valor para contribuir"
                      value={customAmount}
                      min="1"
                      step="0.01"
                      onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="label">Nome Completo *</label>
                    <input
                      className="input"
                      placeholder="Seu nome"
                      value={donorName}
                      onChange={e => setDonorName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">WhatsApp (com DDD) *</label>
                    <input
                      className="input input-whatsapp"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={donorPhone}
                      onChange={e => setDonorPhone(maskPhone(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Mensagem de apoio (opcional)</label>
                    <textarea
                      className="textarea"
                      placeholder="Escreva uma mensagem carinhosa para a Lucianinha..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={2}
                      style={{ minHeight: '60px' }}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="anon_chk"
                      checked={anonymous}
                      onChange={e => setAnonymous(e.target.checked)}
                      style={{ width: 'auto', accentColor: 'var(--vk-green)' }}
                    />
                    <label htmlFor="anon_chk" style={{ margin: 0, fontWeight: 400, fontSize: '0.85rem', color: 'var(--vk-gray)', cursor: 'pointer', textTransform: 'none' }}>
                      Não exibir meu nome na lista pública de doadores
                    </label>
                  </div>

                  {error && <div className="alert alert-error">{error}</div>}

                  <button type="submit" className="btn-contribuir" style={{ marginTop: '1rem', width: '100%' }} disabled={loading}>
                    {loading ? 'Gerando Pix...' : 'Confirmar e Gerar PIX'}
                  </button>
                </form>
              )}

              {checkoutStep === 'pix' && (
                <div className="pix-container">
                  <h3 className="pix-qr-title">Doação via Pix</h3>
                  <p className="pix-qr-subtitle">Escaneie o código QR com o app do seu banco para doar R$ {getAmount().toFixed(2).replace('.', ',')}</p>

                  <div className="pix-qr-frame">
                    {qrCodeBase64 ? (
                      <img
                        src={`data:image/png;base64,${qrCodeBase64}`}
                        alt="QR Code Pix"
                        className="pix-qr-img"
                      />
                    ) : (
                      <div className="pix-spinner" style={{ width: 40, height: 40 }} />
                    )}
                  </div>

                  <div className="pix-copia-cola-title">Pix Copia e Cola</div>
                  <div className="pix-copia-cola-input-group">
                    <input
                      className="pix-copia-cola-input"
                      readOnly
                      value={qrCode}
                      onClick={handleCopyPix}
                    />
                    <button className="btn-copiar-pix" onClick={handleCopyPix}>
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: 'var(--vk-light-gray)', border: '1px solid var(--vk-border)',
                    borderRadius: 'var(--radius)', padding: '0.7rem 1rem', marginTop: '1rem'
                  }}>
                    <span style={{ fontSize: '1.3rem' }}>🏦</span>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--vk-gray)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Conta de destino</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--vk-dark)' }}>JONATHAS QUINTANILHA (GARRÉ)</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--vk-gray)' }}>Mercado Pago</div>
                    </div>
                  </div>

                  <div className="pix-status-box">
                    <div className="pix-spinner" />
                    <span>Aguardando o pagamento...</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--vk-gray)', marginTop: '0.8rem' }}>
                    O sistema confirma a transação automaticamente. Não é preciso enviar comprovante.
                  </p>
                </div>
              )}


              {checkoutStep === 'success' && (
                <div className="pix-success-box">
                  <div className="pix-success-icon">✓</div>
                  <h3 className="pix-success-title">Muito Obrigado!</h3>
                  <p className="pix-success-text">
                    Sua contribuição no valor de R$ {getAmount().toFixed(2).replace('.', ',')} foi confirmada.
                    Ela será essencial para a cirurgia da Lucianinha.
                  </p>
                  <button className="btn-contribuir" onClick={() => setIsModalOpen(false)}>
                    Concluir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="vk-footer">
        <div className="vk-footer-container">
          <div className="vk-footer-about">
            <a href="/" className="vk-footer-logo">
              <div className="vk-footer-logo-heart">✦</div>
              Corrente do Bem
            </a>
            <p>
              Iniciativa de amigos e familiares para apoiar a Lucianinha no tratamento de saúde.
            </p>
          </div>
          <div className="vk-footer-links">
            <a href="/admin/login" className="vk-footer-link">Painel Administrativo</a>
            <a href="/" className="vk-footer-link">Ver Campanha</a>
          </div>
        </div>
        <div className="vk-footer-copyright">
          © {new Date().getFullYear()} Corrente do Bem. Todos os direitos reservados.
        </div>
      </footer>

      {/* BOTÃO FLUTUANTE MOBILE */}
      {!isModalOpen && (
        <div className="mobile-fab-wrap">
          <button className="mobile-fab-btn" onClick={handleOpenModal}>
            💚 {campaign.cta_text || 'Apoiar esta campanha'}
          </button>
        </div>
      )}
    </>
  )
}
