import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createPixPayment } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { donorName, donorPhone, amount, message, anonymous } = body

    if (!donorName || !donorPhone || !amount || amount < 1) {
      return NextResponse.json({ error: 'Dados inválidos. Preencha nome, whatsapp e valor.' }, { status: 400 })
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
      return NextResponse.json({ error: 'Gateway de pagamento não configurado. Adicione o Access Token do MercadoPago no painel administrativo.' }, { status: 500 })
    }

    // Tentar inserir com a coluna donor_phone
    let donation = null
    let dbError = null

    try {
      const { data, error } = await supabaseAdmin
        .from('donations')
        .insert({
          donor_name: donorName,
          donor_phone: donorPhone,
          donor_email: `whatsapp_${donorPhone.replace(/\D/g, '')}@correntedebem.com.br`,
          amount: parseFloat(amount),
          message: message || null,
          anonymous: anonymous || false,
          status: 'pending',
        })
        .select()
        .single()
      
      donation = data
      dbError = error
    } catch {
      // Fallback caso a migração da coluna donor_phone ainda não tenha sido rodada
      const { data, error } = await supabaseAdmin
        .from('donations')
        .insert({
          donor_name: donorName,
          donor_email: `whatsapp_${donorPhone.replace(/\D/g, '')}@correntedebem.com.br`,
          amount: parseFloat(amount),
          message: message ? `${message} (WhatsApp: ${donorPhone})` : `WhatsApp: ${donorPhone}`,
          anonymous: anonymous || false,
          status: 'pending',
        })
        .select()
        .single()

      donation = data
      dbError = error
    }

    if (dbError || !donation) throw dbError || new Error('Erro ao salvar doação no banco de dados')

    // Criar pagamento via Pix direto no MercadoPago
    let paymentResponse: any
    try {
      paymentResponse = await createPixPayment(accessToken, {
        donorName,
        donorPhone,
        amount: parseFloat(amount),
        donationId: donation.id,
      })
    } catch (mpErr: any) {
      console.error('MercadoPago API Error:', mpErr)
      const errorMsg = mpErr?.message || 'Erro ao gerar o Pix no MercadoPago. Verifique suas credenciais.'
      return NextResponse.json({ error: errorMsg }, { status: 500 })
    }

    const paymentId = String(paymentResponse.id)
    const transactionData = paymentResponse.point_of_interaction?.transaction_data

    if (!transactionData) {
      throw new Error('Retorno do MercadoPago não contém dados de transação Pix.')
    }

    const qrCode = transactionData.qr_code
    const qrCodeBase64 = transactionData.qr_code_base64

    // Atualizar doação com os dados do pagamento do MercadoPago
    await supabaseAdmin
      .from('donations')
      .update({ 
        mp_payment_id: paymentId,
        mp_payment_method: 'pix',
        mp_preference_id: qrCode // guarda o qr_code copia e cola temporariamente aqui se precisar
      })
      .eq('id', donation.id)

    return NextResponse.json({
      success: true,
      donationId: donation.id,
      paymentId,
      qrCode,
      qrCodeBase64,
      amount: parseFloat(amount),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('Payment create error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
