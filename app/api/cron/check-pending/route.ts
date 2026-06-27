import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPaymentInfo } from '@/lib/mercadopago'

// Segurança: só aceita chamadas da Vercel Cron ou com o secret correto
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
  return (
    authHeader === `Bearer ${cronSecret}` ||
    request.headers.get('x-vercel-cron') === '1'
  )
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Buscar token do MP
    const { data: configData } = await supabaseAdmin
      .from('config')
      .select('value')
      .eq('key', 'mp_access_token')
      .single()

    const accessToken = configData?.value || process.env.MP_ACCESS_TOKEN
    if (!accessToken || accessToken.trim() === '') {
      return NextResponse.json({ message: 'Access token não configurado', checked: 0 })
    }

    // Buscar doações pendentes com mp_payment_id (foram iniciadas mas não confirmadas)
    const { data: pending, error } = await supabaseAdmin
      .from('donations')
      .select('id, mp_payment_id, amount')
      .eq('status', 'pending')
      .not('mp_payment_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50) // Máximo 50 por vez para não sobrecarregar

    if (error) throw error
    if (!pending || pending.length === 0) {
      return NextResponse.json({ message: 'Nenhuma doação pendente com payment_id', checked: 0 })
    }

    const statusMap: Record<string, string> = {
      approved: 'approved',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      pending: 'pending',
      in_process: 'pending',
      authorized: 'pending',
    }

    let updated = 0
    const results: Array<{ id: string; mpId: string; oldStatus: string; newStatus: string }> = []

    for (const donation of pending) {
      try {
        const payment = await getPaymentInfo(accessToken, donation.mp_payment_id)
        const newStatus = statusMap[payment.status ?? ''] || 'pending'

        if (newStatus !== 'pending') {
          await supabaseAdmin
            .from('donations')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', donation.id)

          results.push({
            id: donation.id,
            mpId: donation.mp_payment_id,
            oldStatus: 'pending',
            newStatus,
          })
          updated++
        }
      } catch (err) {
        console.error(`Erro ao checar doação ${donation.id}:`, err)
      }
    }

    console.log(`[cron] Verificadas ${pending.length} doações, ${updated} atualizadas`)
    return NextResponse.json({
      checked: pending.length,
      updated,
      results,
    })
  } catch (err: any) {
    console.error('[cron] Erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
