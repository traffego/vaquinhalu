'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminConfiguracoes() {
  const router = useRouter()
  const [mpAccessToken, setMpAccessToken] = useState('')
  const [mpAccessTokenMasked, setMpAccessTokenMasked] = useState('')
  const [mpPublicKey, setMpPublicKey] = useState('')
  const [mpMode, setMpMode] = useState('sandbox')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showToken, setShowToken] = useState(false)

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    try {
      const res = await fetch('/api/admin/config')
      if (res.status === 401) { router.push('/admin/login'); return }
      if (!res.ok) throw new Error('API retornou erro')
      const data = await res.json()
      setMpAccessTokenMasked(data.mp_access_token_masked || '')
      setMpPublicKey(data.mp_public_key || '')
      setMpMode(data.mp_mode || 'sandbox')
    } catch (err: any) {
      console.error(err)
      setError('Erro ao carregar configurações do banco de dados. Verifique a chave SUPABASE_SERVICE_ROLE_KEY no painel da Vercel.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(false); setSaving(true)
    try {
      const payload: Record<string, string> = { mp_public_key: mpPublicKey, mp_mode: mpMode }
      if (mpAccessToken) payload.mp_access_token = mpAccessToken

      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setSuccess(true)
      setMpAccessToken('')
      loadConfig()
    } catch {
      setError('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '0.8rem', color: 'var(--vk-gray)' }}>
      <div className="pix-spinner" style={{ width: 24, height: 24 }} />
      <span>Carregando configurações...</span>
    </div>
  )

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">⚙️ Configurações MercadoPago</h1>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🔑 Credenciais de Integração</div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="label">Modo de operação</label>
            <select className="select" value={mpMode} onChange={e => setMpMode(e.target.value)}>
              <option value="sandbox">🧪 Sandbox (testes)</option>
              <option value="production">🚀 Produção</option>
            </select>
            <p className="form-hint">Use sandbox para testar antes de ativar pagamentos reais.</p>
          </div>

          <div className="form-group">
            <label className="label">Access Token (chave secreta)</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showToken ? 'text' : 'password'}
                placeholder={mpAccessTokenMasked || 'APP_USR-xxxx...'}
                value={mpAccessToken}
                onChange={e => setMpAccessToken(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}
              >
                {showToken ? '🙈' : '👁️'}
              </button>
            </div>
            {mpAccessTokenMasked && (
              <p className="form-hint">✅ Token salvo: {mpAccessTokenMasked}. Deixe em branco para manter o atual.</p>
            )}
            <p className="form-hint">Encontre em: MercadoPago → Configurações → Credenciais</p>
          </div>

          <div className="form-group">
            <label className="label">Public Key (chave pública)</label>
            <input
              className="input"
              placeholder="APP_USR-xxxx..."
              value={mpPublicKey}
              onChange={e => setMpPublicKey(e.target.value)}
            />
            <p className="form-hint">Usada no frontend para iniciar o checkout.</p>
          </div>

          {success && <div className="alert alert-success">✅ Configurações salvas com sucesso!</div>}
          {error && <div className="alert alert-error">❌ {error}</div>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '⏳ Salvando...' : '💾 Salvar configurações'}
          </button>
        </form>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🔗 URL do Webhook</div>
        <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
          Configure esta URL nas notificações do MercadoPago para atualizar o status das doações automaticamente:
        </p>
        <div style={{ background: 'var(--gray-100)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--purple-700)', wordBreak: 'break-all' }}>
          {appUrl}/api/payment/webhook
        </div>
        <p className="form-hint" style={{ marginTop: '0.75rem' }}>
          MercadoPago → Configurações → Notificações → URL de notificação instantânea (IPN)
        </p>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">📋 Como configurar</div>
        <ol style={{ paddingLeft: '1.5rem', color: 'var(--gray-600)', lineHeight: 2 }}>
          <li>Acesse <strong>mercadopago.com.br</strong> e faça login</li>
          <li>Vá em <strong>Configurações → Credenciais</strong></li>
          <li>Copie o <strong>Access Token</strong> e a <strong>Public Key</strong></li>
          <li>Cole acima e salve</li>
          <li>Configure a URL do webhook no painel do MercadoPago</li>
          <li>Teste com o modo <strong>Sandbox</strong> antes de ir para produção</li>
        </ol>
      </div>
    </>
  )
}
