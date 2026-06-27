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

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('donations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({ data, count, page, limit })
  } catch (err: any) {
    console.error('donations GET error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao carregar doações' }, { status: 500 })
  }
}
