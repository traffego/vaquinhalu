'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminHistoria() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ story_title: '', story_text: '', hero_image_url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const res = await fetch('/api/admin/campaign')
      if (res.status === 401) { router.push('/admin/login'); return }
      if (!res.ok) throw new Error('API retornou erro')
      const data = await res.json()
      if (data) {
        setForm({
          story_title: data.story_title || '',
          story_text: data.story_text || '',
          hero_image_url: data.hero_image_url || '',
        })
        setPreviewUrl(data.hero_image_url || '')
      }
    } catch (err: any) {
      console.error(err)
      setError('Erro ao carregar história do banco de dados. Verifique a chave SUPABASE_SERVICE_ROLE_KEY no painel da Vercel.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local
    const reader = new FileReader()
    reader.onload = ev => setPreviewUrl(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
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
        setForm(f => ({ ...f, hero_image_url: url }))
        setPreviewUrl(url)
      } else {
        const d = await res.json()
        // Fallback: keep base64 preview, save URL later
        setError(d.error || 'Erro no upload — configure o Supabase Storage')
      }
    } catch {
      setError('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(false); setSaving(true)
    try {
      const campRes = await fetch('/api/admin/campaign')
      const campData = await campRes.json()
      const res = await fetch('/api/admin/campaign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campData, ...form }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setSuccess(true)
    } catch {
      setError('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '0.8rem', color: 'var(--vk-gray)' }}>
      <div className="pix-spinner" style={{ width: 24, height: 24 }} />
      <span>Carregando história...</span>
    </div>
  )

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">💜 História & Foto da Lucianinha</h1>
      </div>

      <form onSubmit={handleSave}>
        {/* Foto */}
        <div className="admin-card">
          <div className="admin-card-title">📸 Foto da Lucianinha</div>
          <div
            className="upload-area"
            onClick={() => fileRef.current?.click()}
          >
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Preview" className="upload-preview" style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: '50%' }} />
                <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  {uploading ? '⏳ Fazendo upload...' : '✅ Foto carregada. Clique para trocar.'}
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📷</div>
                <p style={{ fontWeight: 600, color: 'var(--gray-600)' }}>Clique para escolher a foto</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                  JPG, PNG ou WebP. Recomendado: foto de rosto, fundo claro.
                </p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {form.hero_image_url && (
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="label">URL da imagem (manual)</label>
              <input className="input" name="hero_image_url" value={form.hero_image_url} onChange={handleChange} placeholder="https://..." />
              <p className="form-hint">Você também pode colar uma URL de imagem diretamente.</p>
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="admin-card">
          <div className="admin-card-title">✍️ Texto da Campanha</div>
          <div className="form-group">
            <label className="label">Título principal (aparece no hero)</label>
            <input className="input" name="story_title" value={form.story_title} onChange={handleChange} placeholder="Ex: Juntos pela Lucianinha 💜" />
          </div>
          <div className="form-group">
            <label className="label">História da Lucianinha</label>
            <textarea
              className="textarea"
              name="story_text"
              rows={10}
              value={form.story_text}
              onChange={handleChange}
              placeholder="Escreva a história da Lucianinha aqui. Use parágrafos separados por linha em branco. Este texto vai aparecer na seção 'Conheça a Lucianinha'."
              style={{ minHeight: '220px' }}
            />
            <p className="form-hint">Separe os parágrafos com uma linha em branco. Seja emotivo e verdadeiro! 💜</p>
          </div>

          {success && <div className="alert alert-success">✅ Conteúdo salvo com sucesso!</div>}
          {error && <div className="alert alert-error">❌ {error}</div>}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? '⏳ Salvando...' : '💾 Salvar conteúdo'}
            </button>
            <a href="/" target="_blank" className="btn btn-outline">
              👁️ Ver na campanha
            </a>
          </div>
        </div>
      </form>
    </>
  )
}
