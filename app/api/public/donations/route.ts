import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  try {
    const supabase = getAnonClient()

    // Busca doações aprovadas (RLS permite leitura pública de status=approved)
    const { data: donations, error: donErr } = await supabase
      .from('donations')
      .select('id, donor_name, amount, message, anonymous, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(30)

    if (donErr) throw donErr

    // Total arrecadado: soma todas as doações aprovadas
    const { data: totals, error: totErr } = await supabase
      .from('donations')
      .select('amount')
      .eq('status', 'approved')

    if (totErr) throw totErr

    const total = totals?.reduce((sum, d) => sum + Number(d.amount), 0) ?? 0
    const count = totals?.length ?? 0

    return NextResponse.json({ donations: donations ?? [], total, count })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro interno'
    console.error('public/donations error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
