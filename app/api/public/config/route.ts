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

    // RLS permite leitura pública apenas de mp_public_key e mp_mode
    const { data, error } = await supabase
      .from('config')
      .select('key, value')
      .in('key', ['mp_public_key', 'mp_mode'])

    if (error) throw error

    const config: Record<string, string> = {}
    data?.forEach((c: { key: string; value: string }) => { config[c.key] = c.value })

    return NextResponse.json(config)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro interno'
    console.error('public/config error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
