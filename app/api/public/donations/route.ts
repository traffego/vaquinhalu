import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Busca doações aprovadas
    const { data: donations, error: donErr } = await supabaseAdmin
      .from('donations')
      .select('id, donor_name, amount, message, anonymous, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(30)

    if (donErr) throw donErr

    // Total arrecadado
    const { data: totals, error: totErr } = await supabaseAdmin
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
