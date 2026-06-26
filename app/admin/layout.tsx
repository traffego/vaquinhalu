'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/historia', icon: '💜', label: 'História & Foto' },
  { href: '/admin/campanha', icon: '🎯', label: 'Configurar Campanha' },
  { href: '/admin/configuracoes', icon: '⚙️', label: 'MercadoPago' },
  { href: '/admin/doacoes', icon: '💰', label: 'Doações' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  if (pathname === '/admin/login') return <>{children}</>

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <div className="admin-body">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">
            <span>💜</span>
            <div>
              <div>Corrente do Bem</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Painel Administrativo</div>
            </div>
          </div>
          <nav className="admin-nav">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item${pathname === item.href ? ' active' : ''}`}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="admin-logout">
            <button
              className="admin-nav-item"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <span className="admin-nav-icon">🚪</span>
              {loggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}
