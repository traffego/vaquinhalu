'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCampanha() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', goal_amount: '', deadline: '', status: 'active',
    cta_text: '', suggested_values: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadCampaign() }, [])

  async function loadCampaign() {
    try {
      const res = await fetch('/api/admin/campaign')
      if (res.status === 401) { router.push('/admin/login'); return }
      if (!res.ok) throw new Error('API retornou erro')
      const data = await res.json()
      if (data) {
        setForm({
          name: data.name || '',
          goal_amount: data.goal_amount ? String(data.goal_amount) : '',
          deadline: data.deadline ? data.deadline.split('T')[0] : '',
          status: data.status || 'active',
          cta_text: data.cta_text || '',
          suggested_values: data.suggested_values || '',
        })
      }
    } catch (err: any) {
      console.error(err)
      setError('Erro ao conectar ao banco de dados. Verifique suas credenciais do Supabase no painel Vercel.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(false); setSaving(true)
    try {
      const res = await fetch('/api/admin/campaign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, goal_amount: parseFloat(form.goal_amount) }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setSuccess(true)
    } catch {
      setError('Erro ao salvar campanha')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '0.8rem', color: 'var(--vk-gray)' }}>
      <div className="pix-spinner" style={{ width: 24, height: 24 }} />
      <span>Carregando campanha...</span>
    </div>
  )

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">🎯 Configurar Campanha</h1>
      </div>

      <form onSubmit={handleSave}>
        <div className="admin-card">
          <div className="admin-card-title">📋 Informações da Campanha</div>

          <div className="form-group">
            <label className="label">Nome da campanha</label>
            <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="Ex: Ajuda Lucianinha" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Meta (R$)</label>
              <input className="input" name="goal_amount" type="number" min="1" step="0.01" value={form.goal_amount} onChange={handleChange} placeholder="15000" />
            </div>
            <div className="form-group">
              <label className="label">Data limite</label>
              <input className="input" name="deadline" type="date" value={form.deadline} onChange={handleChange} />
              <p className="form-hint">Opcional. Deixe em branco para sem prazo.</p>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Status da campanha</label>
            <select className="select" name="status" value={form.status} onChange={handleChange}>
              <option value="active">✅ Ativa — aceitando doações</option>
              <option value="paused">⏸️ Pausada — temporariamente suspensa</option>
              <option value="closed">🔒 Encerrada — meta atingida ou encerrada</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Texto do botão de doação (CTA)</label>
            <input className="input" name="cta_text" value={form.cta_text} onChange={handleChange} placeholder="Ex: Quero ajudar a Lucianinha! 💜" />
          </div>

          <div className="form-group">
            <label className="label">Valores sugeridos (separados por vírgula)</label>
            <input className="input" name="suggested_values" value={form.suggested_values} onChange={handleChange} placeholder="10,25,50,100,200,500" />
            <p className="form-hint">Esses valores aparecem como botões rápidos no formulário de doação.</p>
          </div>

          {success && <div className="alert alert-success">✅ Campanha salva com sucesso!</div>}
          {error && <div className="alert alert-error">❌ {error}</div>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '⏳ Salvando...' : '💾 Salvar campanha'}
          </button>
        </div>
      </form>

      {/* Preview */}
      <div className="admin-card">
        <div className="admin-card-title">👁️ Preview da barra de progresso</div>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          <span>R$ 0,00 arrecadados</span>
          <span>Meta: R$ {parseFloat(form.goal_amount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="progress-bar-wrap" style={{ height: '16px' }}>
          <div className="progress-bar-fill" style={{ width: '35%' }} />
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-400)', textAlign: 'right' }}>Preview (35% de exemplo)</p>
      </div>
    </>
  )
}
