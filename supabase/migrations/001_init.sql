-- Tabela de configurações gerais (chave-valor)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela da campanha
CREATE TABLE IF NOT EXISTS campaign (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Corrente do Bem',
  goal_amount DECIMAL(10,2) NOT NULL DEFAULT 15000.00,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'paused')),
  story_title TEXT DEFAULT 'Ajude a Lucianinha a se recuperar',
  story_text TEXT DEFAULT 'Lucianinha precisa da sua ajuda...',
  hero_image_url TEXT,
  cta_text TEXT DEFAULT 'Fazer minha doação agora',
  suggested_values TEXT DEFAULT '10,25,50,100,200',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de doações
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  mp_payment_method TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default campaign
INSERT INTO campaign (name, goal_amount, story_title, story_text, cta_text, suggested_values)
VALUES (
  'Ajuda Lucianinha',
  15000.00,
  'Juntos pela Lucianinha 💜',
  'A Lucianinha é uma pessoa incrível que encheu nossas vidas de alegria e carinho. Agora ela precisa de nós. Ela está enfrentando um momento muito difícil e precisa realizar uma cirurgia para recuperar sua saúde e qualidade de vida. Cada doação, por menor que seja, faz uma diferença enorme. Seja parte dessa corrente do bem e ajude nossa querida amiga a sorrir novamente!',
  'Quero ajudar a Lucianinha! 💜',
  '10,25,50,100,200,500'
) ON CONFLICT DO NOTHING;

-- Insert default MP config placeholders
INSERT INTO config (key, value) VALUES
  ('mp_access_token', ''),
  ('mp_public_key', ''),
  ('mp_mode', 'sandbox')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Policies: leitura pública para campaign
CREATE POLICY "campaign_public_read" ON campaign FOR SELECT USING (true);

-- Policies: leitura pública para donations aprovadas
CREATE POLICY "donations_public_read" ON donations FOR SELECT USING (status = 'approved');

-- Policies: inserção pública para donations
CREATE POLICY "donations_public_insert" ON donations FOR INSERT WITH CHECK (true);

-- Policies: config só leitura pública de mp_public_key
CREATE POLICY "config_public_read" ON config FOR SELECT USING (key = 'mp_public_key' OR key = 'mp_mode');
