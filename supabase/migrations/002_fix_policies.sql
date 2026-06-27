-- Remover policies existentes para recriar sem conflito
DROP POLICY IF EXISTS "campaign_public_read"    ON campaign;
DROP POLICY IF EXISTS "donations_public_read"   ON donations;
DROP POLICY IF EXISTS "donations_public_insert" ON donations;
DROP POLICY IF EXISTS "config_public_read"      ON config;

-- Garantir que RLS está ativo
ALTER TABLE config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign  ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Recriar policies
CREATE POLICY "campaign_public_read"    ON campaign  FOR SELECT USING (true);
CREATE POLICY "donations_public_read"   ON donations FOR SELECT USING (status = 'approved');
CREATE POLICY "donations_public_insert" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "config_public_read"      ON config    FOR SELECT USING (key = 'mp_public_key' OR key = 'mp_mode');

-- Garantir dados iniciais da campanha
INSERT INTO campaign (name, goal_amount, story_title, story_text, cta_text, suggested_values)
VALUES (
  'Ajuda Lucianinha',
  15000.00,
  'Juntos pela Lucianinha',
  'A Lucianinha é uma pessoa incrível que encheu nossas vidas de alegria e carinho. Agora ela precisa de nós. Ela está enfrentando um momento muito difícil e precisa realizar uma cirurgia para recuperar sua saúde e qualidade de vida. Cada contribuição, por menor que seja, faz uma diferença enorme. Seja parte dessa corrente do bem e ajude nossa querida amiga a sorrir novamente.',
  'Quero contribuir',
  '10,25,50,100,200,500'
) ON CONFLICT DO NOTHING;

-- Garantir configs MercadoPago
INSERT INTO config (key, value) VALUES
  ('mp_access_token', ''),
  ('mp_public_key', ''),
  ('mp_mode', 'sandbox')
ON CONFLICT DO NOTHING;
