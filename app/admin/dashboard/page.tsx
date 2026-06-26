'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stats {
  total: number
  count: number
  pending: number
  approved: number
}

interface Donation {
  id: string
  donor_name: string
  amount: number
  status: string
  created_at: string
  anonymous: boolean
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    approved: 'badge-green', pending: 'badge-yellow',
    rejected: 'badge-red', cancelled: 'badge-red', refunded: 'badge-gray'
  }
  const labels: Record<string, string> = {
    approved: '✅ Aprovado', pending: '⏳ Pendente',
    rejected: '❌ Recusado', cancelled: '❌ Cancelado', refunded: '↩️ Reembolsado'
  }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{labels[status] || status}</span>
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [campaign, setCampaign] = useState<{ goal_amount: number; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [donaRes, campRes] = await Promise.all([
        fetch('/api/admin/donations?page=1'),
        fetch('/api/admin/campaign'),
      ])
      if (donaRes.status === 401 || campRes.status === 401) {
        router.push('/admin/login'); return
      }
      const donaData = await donaRes.json()
      const campData = await campRes.json()
      setDonations(donaData.data || [])
      setCampaign(campData)

      const allRes = await fetch('/api/public/donations')
      const allData = await allRes.json()
      const pendingRes = await fetch('/api/admin/donations?status=pending&page=1')
      const pendingData = await pendingRes.json()

      setStats({
        total: allData.total || 0,
        count: allData.count || 0,
        pending: pendingData.count || 0,
        approved: allData.count || 0,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const goalAmount = campaign?.goal_amount || 15000
  const progressPct = stats ? Math.min((stats.total / goalAmount) * 100, 100) : 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💜</div>
        <p style={{ color: 'var(--gray-500)' }}>Carregando dados...</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">📊 Dashboard</h1>
        <Link href="/" target="_blank" className="btn btn-outline btn-sm">
          👁️ Ver campanha
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-icon">💰</span>
          <div>
            <div className="stat-card-val">{formatCurrency(stats?.total || 0)}</div>
            <div className="stat-card-lbl">Total arrecadado</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--pink-500)' }}>
          <span className="stat-card-icon">👥</span>
          <div>
            <div className="stat-card-val">{stats?.count || 0}</div>
            <div className="stat-card-lbl">Doadores</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--gold)' }}>
          <span className="stat-card-icon">🎯</span>
          <div>
            <div className="stat-card-val">{formatCurrency(goalAmount)}</div>
            <div className="stat-card-lbl">Meta da campanha</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#22c55e' }}>
          <span className="stat-card-icon">📈</span>
          <div>
            <div className="stat-card-val">{progressPct.toFixed(1)}%</div>
            <div className="stat-card-lbl">Meta alcançada</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="admin-card">
        <div className="admin-card-title">Progresso da Campanha</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          <span>{formatCurrency(stats?.total || 0)} arrecadados</span>
          <span>Meta: {formatCurrency(goalAmount)}</span>
        </div>
        <div className="progress-bar-wrap" style={{ height: '16px' }}>
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--purple-600)', fontWeight: 600 }}>
          {progressPct.toFixed(1)}% da meta
        </p>
      </div>

      {/* Recent donations */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="admin-card-title">
          <span>Últimas Doações</span>
          <Link href="/admin/doacoes" className="btn btn-outline btn-sm">Ver todas</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Doador</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {donations.slice(0, 8).map(d => (
                <tr key={d.id}>
                  <td>{d.anonymous ? 'Anônimo 💜' : d.donor_name}</td>
                  <td style={{ fontWeight: 600, color: 'var(--purple-600)' }}>{formatCurrency(d.amount)}</td>
                  <td>{statusBadge(d.status)}</td>
                  <td style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                    {new Date(d.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {donations.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>Nenhuma doação ainda 💜</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
