import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin-token')?.value
  return token === process.env.NEXTAUTH_SECRET
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabaseAdmin.from('config').select('*')
  const config: Record<string, string> = {}
  data?.forEach((c: { key: string; value: string }) => { config[c.key] = c.value })

  // Mascarar token
  if (config['mp_access_token'] && config['mp_access_token'].length > 8) {
    config['mp_access_token_masked'] = '••••••••' + config['mp_access_token'].slice(-4)
  }

  return NextResponse.json(config)
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { mp_access_token, mp_public_key, mp_mode } = body

  const updates = []

  if (mp_access_token !== undefined && !mp_access_token.includes('••••')) {
    updates.push({ key: 'mp_access_token', value: mp_access_token, updated_at: new Date().toISOString() })
  }
  if (mp_public_key !== undefined) {
    updates.push({ key: 'mp_public_key', value: mp_public_key, updated_at: new Date().toISOString() })
  }
  if (mp_mode !== undefined) {
    updates.push({ key: 'mp_mode', value: mp_mode, updated_at: new Date().toISOString() })
  }

  for (const update of updates) {
    await supabaseAdmin.from('config').upsert(update, { onConflict: 'key' })
  }

  return NextResponse.json({ success: true })
}
