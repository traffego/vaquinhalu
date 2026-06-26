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

export default function AdminDoacoes() {
  const router = useRouter()
  const [donations, setDonations] = useState<Donation[]>([])
  const [count, setCount] = useState(0)
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (t: string, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (t !== 'all') params.set('status', t)
    const res = await fetch(`/api/admin/donations?${params}`)
    if (res.status === 401) { router.push('/admin/login'); return }
    const data = await res.json()
    setDonations(data.data || [])
    setCount(data.count || 0)
    setLoading(false)
  }, [router])

  useEffect(() => { load(tab, page) }, [tab, page, load])

  function handleTabChange(t: string) {
    setTab(t); setPage(1)
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
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>💜 Carregando...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Doador</th>
                  <th>Email</th>
                  <th>Valor</th>
                  <th>Método</th>
                  <th>Status</th>
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
                      {d.mp_payment_id && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>MP: {d.mp_payment_id}</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{d.donor_email || '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--purple-600)' }}>{formatCurrency(d.amount)}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{d.mp_payment_method || '—'}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td style={{ maxWidth: 180, fontSize: '0.85rem', color: 'var(--gray-600)' }}>
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
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                      Nenhuma doação encontrada 💜
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Página {page} de {totalPages}
            </span>
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
          </div>
        )}
      </div>
    </>
  )
}
