import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('config')
    .select('key, value')
    .in('key', ['mp_public_key', 'mp_mode'])

  const config: Record<string, string> = {}
  data?.forEach((c: { key: string; value: string }) => { config[c.key] = c.value })
  return NextResponse.json(config)
}
