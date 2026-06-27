import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPaymentInfo } from '@/lib/mercadopago'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const donationId = searchParams.get('donationId')

  if (!donationId) {
    return NextResponse.json({ error: 'donationId é obrigatório' }, { status: 400 })
  }

  try {
    // 1. Buscar doação no banco
    const { data: donation, error: dbError } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .single()

    if (dbError || !donation) {
      return NextResponse.json({ error: 'Doação não encontrada' }, { status: 404 })
    }

    // 2. Se a doação ainda estiver pendente, mas tiver mp_payment_id, consultamos o MP diretamente para ser em tempo real
    if (donation.status === 'pending' && donation.mp_payment_id) {
      const { data: configData } = await supabaseAdmin
        .from('config')
        .select('key, value')
        .eq('key', 'mp_access_token')
        .single()

      const accessToken = configData?.value || process.env.MP_ACCESS_TOKEN
      if (accessToken) {
        try {
          const payment = await getPaymentInfo(accessToken, donation.mp_payment_id)
          if (payment && payment.status) {
            const statusMap: Record<string, string> = {
              approved: 'approved',
              rejected: 'rejected',
              cancelled: 'cancelled',
              refunded: 'refunded',
              pending: 'pending',
              in_process: 'pending',
            }
            const currentStatus = statusMap[payment.status] || 'pending'
            
            if (currentStatus !== donation.status) {
              // Atualizar no banco de dados se tiver mudado
              await supabaseAdmin
                .from('donations')
                .update({ 
                  status: currentStatus, 
                  updated_at: new Date().toISOString() 
                })
                .eq('id', donationId)
              
              return NextResponse.json({ status: currentStatus })
            }
          }
        } catch (err) {
          console.error('Erro ao consultar status direto no MP:', err)
        }
      }
    }

    return NextResponse.json({ status: donation.status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
