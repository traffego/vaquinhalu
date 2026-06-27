import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin-token')?.value
  return token === process.env.NEXTAUTH_SECRET
}

// Upload de imagem (base64 para Supabase Storage)
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { imageBase64, fileName, contentType } = body

    if (!imageBase64 || !fileName) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const { data, error } = await supabaseAdmin.storage
      .from('campaign-images')
      .upload(`hero/${Date.now()}_${fileName}`, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: true,
      })

    if (error) {
      throw error
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('campaign-images')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: any) {
    console.error('upload POST error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao realizar upload da imagem no Supabase Storage' }, { status: 500 })
  }
}
