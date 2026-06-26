import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: donations } = await supabaseAdmin
    .from('donations')
    .select('id, donor_name, amount, message, anonymous, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: totals } = await supabaseAdmin
    .from('donations')
    .select('amount')
    .eq('status', 'approved')

  const total = totals?.reduce((sum, d) => sum + Number(d.amount), 0) || 0
  const count = totals?.length || 0

  return NextResponse.json({ donations: donations || [], total, count })
}
