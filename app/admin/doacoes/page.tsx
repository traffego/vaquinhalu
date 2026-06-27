'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Donation {
  id: string
  donor_name: string
  donor_email: string
  amount: number
  message: string | null
  status: string
  mp_payment_id: string | null
  mp_payment_method: string | null
  anonymous: boolean
  created_at: string
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    approved: ['badge-green', '✅ Aprovado'],
    pending:  ['badge-yellow', '⏳ Pendente'],
    rejected: ['badge-red', '❌ Recusado'],
    cancelled:['badge-red', '❌ Cancelado'],
    refunded: ['badge-gray', '↩️ Reembolsado'],
  }
  const [cls, label] = map[status] || ['badge-gray', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

const TABS = [
  { key: 'all', label: 'Todas' },
  { key: 'approved', label: '✅ Aprovadas' },
  { key: 'pending', label: '⏳ Pendentes' },
  { key: 'rejected', label: '❌ Recusadas' },
]

const STATUS_OPTIONS = [
  { value: 'approved',  label: '✅ Aprovado' },
  { value: 'pending',   label: '⏳ Pendente' },
  { value: 'rejected',  label: '❌ Recusado' },
  { value: 'cancelled', label: '❌ Cancelado' },
  { value: 'refunded',  label: '↩️ Reembolsado' },
]

export default function AdminDoacoes() {
  const router = useRouter()
  const [donations, setDonations] = useState<Donation[]>([])
  const [count, setCount] = useState(0)
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const load = useCallback(async (t: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (t !== 'all') params.set('status', t)
      const res = await fetch(`/api/admin/donations?${params}`)
      if (res.status === 401) { router.push('/admin/login'); return }
      if (!res.ok) throw new Error('Erro na API')
      const data = await res.json()
      setDonations(data.data || [])
      setCount(data.count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load(tab, page) }, [tab, page, load])

  function handleTabChange(t: string) { setTab(t); setPage(1) }

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      // Atualiza localmente sem recarregar a lista inteira
      setDonations(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
      setToast(`Status atualizado para "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus}"`)
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('❌ Erro ao atualizar status')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setUpdating(null)
    }
  }

  async function exportCsv() {
    const res = await fetch('/api/admin/donations?page=1&limit=9999')
    const data = await res.json()
    const rows = data.data || []
    const headers = ['Nome', 'Email', 'Valor', 'Status', 'Mensagem', 'Anônimo', 'Data']
    const csv = [
      headers.join(';'),
      ...rows.map((d: Donation) => [
        d.anonymous ? 'Anônimo' : d.donor_name,
        d.donor_email || '',
        String(d.amount).replace('.', ','),
        d.status,
        (d.message || '').replace(/;/g, ','),
        d.anonymous ? 'Sim' : 'Não',
        new Date(d.created_at).toLocaleDateString('pt-BR'),
      ].join(';'))
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `doacoes_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const totalPages = Math.ceil(count / 20)

  return (
    <>
      {/* Toast de feedback */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
          background: toast.startsWith('❌') ? '#dc2626' : 'var(--vk-green)',
          color: '#fff', padding: '0.8rem 1.4rem', borderRadius: 'var(--radius)',
          fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast}
        </div>
      )}

      <div className="admin-topbar">
        <h1 className="admin-page-title">💰 Doações ({count})</h1>
        <button className="btn btn-outline btn-sm" onClick={exportCsv}>📥 Exportar CSV</button>
      </div>

      <div className="admin-card">
        <div className="tab-bar">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => handleTabChange(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.8rem', color: 'var(--vk-gray)' }}>
            <div className="pix-spinner" style={{ width: 24, height: 24 }} />
            <span>Carregando doações...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Doador</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Alterar Status</th>
                  <th>Mensagem</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {d.anonymous ? '🔒 Anônimo' : d.donor_name}
                      </div>
                      {d.donor_email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--vk-gray)' }}>{d.donor_email}</div>
                      )}
                      {d.mp_payment_id && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontFamily: 'monospace' }}>
                          MP: {d.mp_payment_id}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--vk-green)', whiteSpace: 'nowrap' }}>
                      {formatCurrency(d.amount)}
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {d.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(d.id, 'approved')}
                            disabled={updating === d.id}
                            style={{
                              background: 'var(--vk-green)', color: '#fff',
                              border: 'none', borderRadius: 'var(--radius-sm)',
                              padding: '0.3rem 0.7rem', fontSize: '0.78rem',
                              fontWeight: 700, cursor: 'pointer', opacity: updating === d.id ? 0.6 : 1
                            }}
                          >
                            {updating === d.id ? '...' : '✅ Confirmar'}
                          </button>
                        )}
                        {d.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusChange(d.id, 'pending')}
                            disabled={updating === d.id}
                            style={{
                              background: '#d97706', color: '#fff',
                              border: 'none', borderRadius: 'var(--radius-sm)',
                              padding: '0.3rem 0.7rem', fontSize: '0.78rem',
                              fontWeight: 700, cursor: 'pointer', opacity: updating === d.id ? 0.6 : 1
                            }}
                          >
                            ⏳ Pendente
                          </button>
                        )}
                        {d.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(d.id, 'cancelled')}
                            disabled={updating === d.id}
                            style={{
                              background: '#dc2626', color: '#fff',
                              border: 'none', borderRadius: 'var(--radius-sm)',
                              padding: '0.3rem 0.7rem', fontSize: '0.78rem',
                              fontWeight: 700, cursor: 'pointer', opacity: updating === d.id ? 0.6 : 1
                            }}
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ maxWidth: 180, fontSize: '0.85rem', color: 'var(--vk-gray)' }}>
                      {d.message ? `"${d.message.slice(0, 60)}${d.message.length > 60 ? '…' : ''}"` : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                      {new Date(d.created_at).toLocaleDateString('pt-BR')}<br />
                      {new Date(d.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                      Nenhuma doação encontrada 💜
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--vk-gray)' }}>
              Página {page} de {totalPages}
            </span>
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
          </div>
        )}
      </div>
    </>
  )
}
