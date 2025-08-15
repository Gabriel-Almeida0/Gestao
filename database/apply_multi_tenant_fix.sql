-- =========================================================
-- SCRIPT RÁPIDO PARA APLICAR CORREÇÕES MULTI-TENANT
-- Execute este script no MySQL para aplicar todas as correções
-- =========================================================

USE gestao_financeira;

-- 1. Adicionar coluna is_active se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Atualizar registros existentes para serem ativos
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

-- 3. Para teste: Criar um tenant de exemplo se não houver nenhum
INSERT IGNORE INTO tenants (id, name, slug, active) 
VALUES (1, 'Tenant Padrão', 'tenant_padrao', TRUE);

-- 4. Garantir que todos os usuários tenham um tenant_id válido
UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;

-- 5. Mensagem de conclusão
SELECT 'Correções aplicadas com sucesso!' as Resultado;

-- Para aplicar a migração completa para tenants individuais, execute:
-- source migrate_to_individual_tenants.sql