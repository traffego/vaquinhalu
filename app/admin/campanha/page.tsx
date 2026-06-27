'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCampanha() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    story_title: '',
    story_text: '',
    goal_amount: '',
    deadline: '',
    status: 'active',
    cta_text: '',
    suggested_values: '',
  })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
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
          story_title: data.story_title || '',
          story_text: data.story_text || '',
          goal_amount: data.goal_amount ? String(data.goal_amount) : '',
          deadline: data.deadline ? data.deadline.split('T')[0] : '',
          status: data.status || 'active',
          cta_text: data.cta_text || '',
          suggested_values: data.suggested_values || '',
        })

        // Tratar hero_image_url como lista de fotos (JSON ou URL única)
        if (data.hero_image_url) {
          try {
            const parsed = JSON.parse(data.hero_image_url)
            setImageUrls(Array.isArray(parsed) ? parsed : [data.hero_image_url])
          } catch {
            setImageUrls([data.hero_image_url])
          }
        }
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onload = ev => resolve(ev.target?.result as string)
          r.onerror = reject
          r.readAsDataURL(file)
        })

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, fileName: file.name, contentType: file.type }),
        })

        if (res.ok) {
          const { url } = await res.json()
          setImageUrls(prev => [...prev, url])
        } else {
          const d = await res.json()
          setError(d.error || 'Erro no upload — verifique o Supabase Storage')
        }
      }
    } catch {
      setError('Erro ao fazer upload das imagens')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleRemoveImage(idx: number) {
    setImageUrls(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(false); setSaving(true)
    try {
      const res = await fetch('/api/admin/campaign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          goal_amount: parseFloat(form.goal_amount) || 0,
          hero_image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erro ao salvar')
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar campanha')
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
        <h1 className="admin-page-title">🎯 Editar Campanha</h1>
        <a href="/" target="_blank" className="btn btn-outline btn-sm">👁️ Ver ao Vivo</a>
      </div>

      <form onSubmit={handleSave}>

        {/* ── GALERIA DE FOTOS ── */}
        <div className="admin-card">
          <div className="admin-card-title">📸 Galeria de Fotos</div>

          {imageUrls.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {imageUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--vk-border)' }}>
                  <img src={url} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      backgroundColor: 'rgba(220,38,38,0.9)', color: 'white',
                      border: 'none', borderRadius: '50%', width: 22, height: 22,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold'
                    }}
                    title="Remover foto"
                  >×</button>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.65rem', textAlign: 'center', padding: '2px 0' }}>
                    Foto {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="upload-area" onClick={() => fileRef.current?.click()}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>📷</div>
            <p style={{ fontWeight: 700, color: 'var(--vk-dark)' }}>
              {uploading ? 'Enviando fotos...' : 'Clique para adicionar fotos'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--vk-gray)', marginTop: '0.2rem' }}>
              Pode selecionar várias de uma vez. JPG, PNG ou WebP.
            </p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {/* ── TEXTO DA HISTÓRIA ── */}
        <div className="admin-card">
          <div className="admin-card-title">✍️ História da Campanha</div>

          <div className="form-group">
            <label className="label">Título principal (aparece no topo da página pública)</label>
            <input className="input" name="story_title" value={form.story_title} onChange={handleChange} placeholder="Ex: Juntos pela recuperação da Lucianinha" />
          </div>

          <div className="form-group">
            <label className="label">Texto da história</label>
            <textarea
              className="textarea"
              name="story_text"
              rows={8}
              value={form.story_text}
              onChange={handleChange}
              placeholder="Escreva a história aqui. Separe os parágrafos com uma linha em branco."
              style={{ minHeight: 180 }}
            />
            <p className="form-hint">Cada parágrafo separado por Enter aparecerá individualmente na página pública.</p>
          </div>
        </div>

        {/* ── CONFIGURAÇÕES GERAIS ── */}
        <div className="admin-card">
          <div className="admin-card-title">⚙️ Configurações Gerais</div>

          <div className="form-group">
            <label className="label">Nome interno da campanha</label>
            <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="Ex: Campanha Lucianinha 2024" />
            <p className="form-hint">Usado apenas no painel administrativo.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Meta de arrecadação (R$)</label>
              <input className="input" name="goal_amount" type="number" min="1" step="0.01" value={form.goal_amount} onChange={handleChange} placeholder="15000" />
            </div>
            <div className="form-group">
              <label className="label">Data limite (opcional)</label>
              <input className="input" name="deadline" type="date" value={form.deadline} onChange={handleChange} />
              <p className="form-hint">Deixe em branco para sem prazo.</p>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Status da campanha</label>
            <select className="select" name="status" value={form.status} onChange={handleChange}>
              <option value="active">✅ Ativa — aceitando doações</option>
              <option value="paused">⏸️ Pausada — temporariamente suspensa</option>
              <option value="closed">🔒 Encerrada — meta atingida ou campanha finalizada</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Texto do botão principal (CTA)</label>
            <input className="input" name="cta_text" value={form.cta_text} onChange={handleChange} placeholder="Ex: Apoiar esta campanha" />
          </div>

          <div className="form-group">
            <label className="label">Valores sugeridos (separados por vírgula)</label>
            <input className="input" name="suggested_values" value={form.suggested_values} onChange={handleChange} placeholder="25,50,100,250" />
            <p className="form-hint">Aparecem como botões rápidos no formulário de doação da página pública.</p>
          </div>
        </div>

        {/* ── AÇÕES ── */}
        {success && <div className="alert alert-success">✅ Campanha salva com sucesso! As alterações já estão no ar.</div>}
        {error && <div className="alert alert-error">❌ {error}</div>}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving || uploading} style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
            {saving ? 'Salvando...' : 'Salvar Campanha'}
          </button>
          <a href="/" target="_blank" className="btn btn-outline">
            Ver campanha ao vivo
          </a>
        </div>
      </form>
    </>
  )
}
