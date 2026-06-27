import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('campaign')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) throw error
    return NextResponse.json(data?.[0] ?? {})
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro interno'
    console.error('public/campaign error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
