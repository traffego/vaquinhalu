'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminHistoria() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ story_title: '', story_text: '' })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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
        })
        
        // Tratar hero_image_url como lista de fotos (JSON ou URL única)
        if (data.hero_image_url) {
          try {
            const parsed = JSON.parse(data.hero_image_url)
            if (Array.isArray(parsed)) {
              setImageUrls(parsed)
            } else {
              setImageUrls([data.hero_image_url])
            }
          } catch {
            setImageUrls([data.hero_image_url])
          }
        } else {
          setImageUrls([])
        }
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
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')
    try {
      // Loop para permitir múltiplos uploads um após o outro
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
          setError(d.error || 'Erro no upload de alguma foto — verifique o Supabase Storage')
        }
      }
    } catch {
      setError('Erro ao fazer upload das imagens')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = '' // limpa o input
    }
  }

  function handleRemoveImage(indexToRemove: number) {
    setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove))
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
        body: JSON.stringify({ 
          ...campData, 
          ...form,
          hero_image_url: JSON.stringify(imageUrls) // Salva como array em formato de string
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setSuccess(true)
    } catch {
      setError('Erro ao salvar alterações')
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
        <h1 className="admin-page-title">💜 História & Galeria de Fotos</h1>
      </div>

      <form onSubmit={handleSave}>
        {/* Galeria de Fotos */}
        <div className="admin-card">
          <div className="admin-card-title">📸 Galeria de Fotos da Lucianinha</div>
          
          {imageUrls.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {imageUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--vk-border)' }}>
                  <img src={url} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: 'absolute', top: '4px', right: '4px',
                      backgroundColor: 'rgba(220, 38, 38, 0.85)', color: 'white',
                      border: 'none', borderRadius: '50%', width: '22px', height: '22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', lineHeight: 1
                    }}
                    title="Remover foto"
                  >
                    &times;
                  </button>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
                    fontSize: '0.65rem', textAlign: 'center', padding: '2px 0'
                  }}>
                    Foto {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="upload-area"
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
            <p style={{ fontWeight: 700, color: 'var(--vk-dark)' }}>
              {uploading ? 'Enviando imagens...' : 'Clique para adicionar fotos'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--vk-gray)', marginTop: '0.25rem' }}>
              Você pode selecionar uma ou várias imagens de cada vez.
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Texto da História */}
        <div className="admin-card">
          <div className="admin-card-title">✍️ Texto da Campanha</div>
          
          <div className="form-group">
            <label className="label">Título principal (aparece na página)</label>
            <input 
              className="input" 
              name="story_title" 
              value={form.story_title} 
              onChange={handleChange} 
              placeholder="Ex: Juntos pela recuperação da Lucianinha" 
              required
            />
          </div>
          
          <div className="form-group">
            <label className="label">História da Lucianinha</label>
            <textarea
              className="textarea"
              name="story_text"
              rows={10}
              value={form.story_text}
              onChange={handleChange}
              placeholder="Escreva a história aqui. Pressione Enter duas vezes para iniciar um novo parágrafo."
              style={{ minHeight: '220px' }}
              required
            />
            <p className="form-hint">Dica: Separe a história em parágrafos curtos para facilitar a leitura dos doadores. 💜</p>
          </div>

          {success && <div className="alert alert-success">✅ Alterações salvas com sucesso!</div>}
          {error && <div className="alert alert-error">❌ {error}</div>}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <a href="/" target="_blank" className="btn btn-outline">
              Ver Campanha ao Vivo
            </a>
          </div>
        </div>
      </form>
    </>
  )
}
