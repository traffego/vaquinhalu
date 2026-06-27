-- Migration para adicionar a coluna de telefone/whatsapp na tabela de doações
ALTER TABLE donations ADD COLUMN IF NOT EXISTS donor_phone TEXT;
