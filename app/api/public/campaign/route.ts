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
    const { data, error } = await supabase.from('campaign').select('*').single()
    if (error) throw error
    return NextResponse.json(data || {})
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro interno'
    console.error('public/campaign error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
