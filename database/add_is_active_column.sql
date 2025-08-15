-- Adicionar coluna is_active na tabela users
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Atualizar registros existentes para serem ativos
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;