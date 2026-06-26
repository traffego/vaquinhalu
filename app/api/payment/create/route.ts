import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createDonationPreference } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { donorName, donorEmail, amount, message, anonymous } = body

    if (!donorName || !amount || amount < 1) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar access token do banco
    const { data: configData } = await supabaseAdmin
      .from('config')
      .select('key, value')
      .in('key', ['mp_access_token', 'mp_public_key'])

    const config: Record<string, string> = {}
    configData?.forEach((c: { key: string; value: string }) => { config[c.key] = c.value })

    const accessToken = config['mp_access_token'] || process.env.MP_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json({ error: 'Gateway de pagamento não configurado' }, { status: 500 })
    }

    // Criar doação no banco (pending)
    const { data: donation, error: dbError } = await supabaseAdmin
      .from('donations')
      .insert({
        donor_name: donorName,
        donor_email: donorEmail || null,
        amount: parseFloat(amount),
        message: message || null,
        anonymous: anonymous || false,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) throw dbError

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Criar preferência no MercadoPago
    const preference = await createDonationPreference(accessToken, {
      donorName,
      donorEmail: donorEmail || 'doador@correntedebem.com.br',
      amount: parseFloat(amount),
      donationId: donation.id,
      appUrl,
    })

    // Salvar preference_id
    await supabaseAdmin
      .from('donations')
      .update({ mp_preference_id: preference.id })
      .eq('id', donation.id)

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      donationId: donation.id,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('Payment create error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
