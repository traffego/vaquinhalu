import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import HomeClient from './HomeClient'

// Busca campanha no servidor para gerar OG tags dinâmicas
async function getCampaign() {
  try {
    const { data } = await supabaseAdmin
      .from('campaign')
      .select('name, story_title, story_text, hero_image_url')
      .order('updated_at', { ascending: false })
      .limit(1)
    return data?.[0] ?? null
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const campaign = await getCampaign()

  const title = campaign?.story_title || campaign?.name || 'Corrente do Bem – Ajude a Lucianinha'

  // Primeiro parágrafo da história como descrição
  const description = campaign?.story_text
    ? campaign.story_text.split('\n').find((p: string) => p.trim().length > 20)?.trim().slice(0, 160) + '...'
    : 'Faça parte dessa corrente de amor e solidariedade. Cada doação faz diferença!'

  // Primeira imagem do array JSON como OG image
  let ogImage: string | undefined
  if (campaign?.hero_image_url) {
    try {
      const imgs = JSON.parse(campaign.hero_image_url)
      ogImage = Array.isArray(imgs) ? imgs[0] : campaign.hero_image_url
    } catch {
      ogImage = campaign.hero_image_url
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vaquinhalu.vercel.app'

  return {
    title,
    description,
    keywords: ['doação', 'solidariedade', 'ajuda', 'cirurgia', 'corrente do bem', 'lucianinha'],
    openGraph: {
      title,
      description,
      type: 'website',
      url: appUrl,
      siteName: 'Corrente do Bem',
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

export default function Page() {
  return <HomeClient />
}
