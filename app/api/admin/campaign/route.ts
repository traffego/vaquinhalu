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
    const { data, error } = await supabaseAdmin
      .from('campaign')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) throw error
    return NextResponse.json(data?.[0] ?? null)
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

    // Busca a linha mais recente (sem .single() para não quebrar com múltiplas linhas)
    const { data: rows, error: findError } = await supabaseAdmin
      .from('campaign')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (findError) throw findError

    const existingId = rows?.[0]?.id

    let result
    if (existingId) {
      // Sempre atualiza a linha mais recente
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
        .eq('id', existingId)
        .select()
        .limit(1)

      if (error) throw error
      result = data?.[0]
    } else {
      // Só insere se a tabela estiver completamente vazia
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
        .limit(1)

      if (error) throw error
      result = data?.[0]
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('campaign PUT error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao salvar campanha no banco' }, { status: 500 })
  }
}
