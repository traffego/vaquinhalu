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
  const { data } = await supabaseAdmin.from('campaign').select('*').single()
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    name, goal_amount, deadline, status,
    story_title, story_text, cta_text, suggested_values, hero_image_url
  } = body

  const { data: existing } = await supabaseAdmin.from('campaign').select('id').single()

  let result
  if (existing?.id) {
    const { data } = await supabaseAdmin
      .from('campaign')
      .update({ name, goal_amount, deadline, status, story_title, story_text, cta_text, suggested_values, hero_image_url, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    result = data
  } else {
    const { data } = await supabaseAdmin
      .from('campaign')
      .insert({ name, goal_amount, deadline, status, story_title, story_text, cta_text, suggested_values, hero_image_url })
      .select()
      .single()
    result = data
  }

  return NextResponse.json(result)
}
