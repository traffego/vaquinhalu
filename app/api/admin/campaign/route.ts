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
    const { data, error } = await supabaseAdmin.from('campaign').select('*').single()
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(null) // Tabela vazia
      }
      throw error
    }
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('campaign GET error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar dados da campanha' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name, goal_amount, deadline, status,
      story_title, story_text, cta_text, suggested_values, hero_image_url
    } = body

    const cleanDeadline = deadline && deadline.trim() !== '' ? deadline : null

    const { data: existing, error: findError } = await supabaseAdmin.from('campaign').select('id').single()
    
    // Tratamos erro de linha não encontrada sem crashar
    const hasExisting = existing && !findError

    let result
    if (hasExisting && existing?.id) {
      const { data, error } = await supabaseAdmin
        .from('campaign')
        .update({ 
          name, 
          goal_amount, 
          deadline: cleanDeadline, 
          status, 
          story_title, 
          story_text, 
          cta_text, 
          suggested_values, 
          hero_image_url, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('campaign')
        .insert({ 
          name, 
          goal_amount, 
          deadline: cleanDeadline, 
          status, 
          story_title, 
          story_text, 
          cta_text, 
          suggested_values, 
          hero_image_url 
        })
        .select()
        .single()
      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('campaign PUT error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao salvar campanha no banco' }, { status: 500 })
  }
}
