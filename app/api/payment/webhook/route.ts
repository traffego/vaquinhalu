import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPaymentInfo } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (type === 'payment' && data?.id) {
      const paymentId = String(data.id)

      // Buscar access token
      const { data: configData } = await supabaseAdmin
        .from('config')
        .select('key, value')
        .eq('key', 'mp_access_token')
        .single()

      const accessToken = configData?.value || process.env.MP_ACCESS_TOKEN
      if (!accessToken) return NextResponse.json({ ok: true })

      // Buscar info do pagamento no MP
      const payment = await getPaymentInfo(accessToken, paymentId)

      const donationId = payment.external_reference
      if (!donationId) return NextResponse.json({ ok: true })

      const statusMap: Record<string, string> = {
        approved: 'approved',
        rejected: 'rejected',
        cancelled: 'cancelled',
        refunded: 'refunded',
        pending: 'pending',
        in_process: 'pending',
      }

      const status = statusMap[payment.status || ''] || 'pending'

      await supabaseAdmin
        .from('donations')
        .update({
          status,
          mp_payment_id: paymentId,
          mp_payment_method: payment.payment_method_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', donationId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true }) // sempre 200 para o MP
  }
}

// MercadoPago também envia GET com query params
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic')
  const id = searchParams.get('id')

  if (topic === 'payment' && id) {
    try {
      const { data: configData } = await supabaseAdmin
        .from('config')
        .select('value')
        .eq('key', 'mp_access_token')
        .single()

      const accessToken = configData?.value || process.env.MP_ACCESS_TOKEN
      if (!accessToken) return NextResponse.json({ ok: true })

      const payment = await getPaymentInfo(accessToken, id)
      const donationId = payment.external_reference
      if (!donationId) return NextResponse.json({ ok: true })

      const status = payment.status === 'approved' ? 'approved'
        : payment.status === 'rejected' ? 'rejected'
        : 'pending'

      await supabaseAdmin
        .from('donations')
        .update({ status, mp_payment_id: id, updated_at: new Date().toISOString() })
        .eq('id', donationId)
    } catch (err) {
      console.error('Webhook GET error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
