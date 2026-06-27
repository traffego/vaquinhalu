import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('campaign').select('*').single()
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({})
      }
      throw error
    }
    return NextResponse.json(data || {})
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro interno'
    console.error('public/campaign error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
