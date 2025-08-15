-- =========================================================
-- SCRIPT DE MIGRAÇÃO PARA MULTI-TENANT INDIVIDUAL
-- Este script cria tenants individuais para usuários existentes
-- e migra os dados compartilhados para os tenants corretos
-- =========================================================

USE gestao_financeira;

-- 1. Criar tenants individuais para usuários existentes (exceto admins)
DELIMITER $$
DROP PROCEDURE IF EXISTS create_individual_tenants$$
CREATE PROCEDURE create_individual_tenants()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_id INT;
    DECLARE user_name VARCHAR(255);
    DECLARE user_email VARCHAR(255);
    DECLARE user_role VARCHAR(50);
    DECLARE current_tenant_id INT;
    DECLARE new_tenant_id INT;
    
    -- Cursor para usuários não-admin
    DECLARE user_cursor CURSOR FOR 
        SELECT id, name, email, role, tenant_id 
        FROM users 
        WHERE role != 'admin' AND tenant_id = 1;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN user_cursor;
    
    read_loop: LOOP
        FETCH user_cursor INTO user_id, user_name, user_email, user_role, current_tenant_id;
        
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Criar novo tenant para o usuário
        SET @tenant_name = CONCAT(user_name, '''s Workspace');
        SET @tenant_slug = CONCAT(SUBSTRING_INDEX(user_email, '@', 1), '_', user_id);
        
        INSERT INTO tenants (name, slug, active) 
        VALUES (@tenant_name, @tenant_slug, TRUE);
        
        SET new_tenant_id = LAST_INSERT_ID();
        
        -- Atualizar o tenant_id do usuário
        UPDATE users 
        SET tenant_id = new_tenant_id 
        WHERE id = user_id;
        
        -- Migrar dados do tenant 1 para o novo tenant (se existirem)
        -- Migrar atendentes
        UPDATE atendentes 
        SET tenant_id = new_tenant_id 
        WHERE tenant_id = 1;
        
        -- Migrar tripeiros
        UPDATE tripeiros 
        SET tenant_id = new_tenant_id 
        WHERE tenant_id = 1;
        
        -- Migrar pagamentos
        UPDATE pagamentos 
        SET tenant_id = new_tenant_id 
        WHERE tenant_id = 1;
        
        -- Migrar despesas
        UPDATE despesas 
        SET tenant_id = new_tenant_id 
        WHERE tenant_id = 1;
        
        -- Migrar recebimentos
        UPDATE recebimentos 
        SET tenant_id = new_tenant_id 
        WHERE tenant_id = 1;
        
        -- Migrar categorias de despesas
        UPDATE categorias_despesas 
        SET tenant_id = new_tenant_id 
        WHERE tenant_id = 1;
        
        -- Migrar contas de tripeiros
        UPDATE contas_tripeiros 
        SET tenant_id = new_tenant_id 
        WHERE tenant_id = 1;
        
        -- Migrar notas
        UPDATE notas 
        SET tenant_id = new_tenant_id 
        WHERE tenant_id = 1;
        
        -- Migrar lembretes
        UPDATE lembretes 
        SET tenant_id = new_tenant_id 
        WHERE tenant_id = 1;
        
    END LOOP;
    
    CLOSE user_cursor;
END$$
DELIMITER ;

-- 2. Criar tenant especial para administradores
INSERT INTO tenants (name, slug, active) 
VALUES ('Admin Global', 'admin_global', TRUE)
ON DUPLICATE KEY UPDATE name = name;

-- Obter o ID do tenant admin
SET @admin_tenant_id = (SELECT id FROM tenants WHERE slug = 'admin_global');

-- 3. Atualizar usuários admin para usar o tenant admin
UPDATE users 
SET tenant_id = @admin_tenant_id 
WHERE role = 'admin' AND (tenant_id = 1 OR tenant_id IS NULL);

-- 4. Executar o procedimento de migração
CALL create_individual_tenants();

-- 5. Limpar o procedimento temporário
DROP PROCEDURE IF EXISTS create_individual_tenants;

-- 6. Criar dados de exemplo para novos tenants (opcional)
-- Este passo é útil para ter alguns dados iniciais em cada workspace

DELIMITER $$
DROP PROCEDURE IF EXISTS create_sample_data_for_tenants$$
CREATE PROCEDURE create_sample_data_for_tenants()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE tenant_id INT;
    
    DECLARE tenant_cursor CURSOR FOR 
        SELECT id FROM tenants WHERE slug != 'admin_global' AND active = TRUE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN tenant_cursor;
    
    read_loop: LOOP
        FETCH tenant_cursor INTO tenant_id;
        
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Verificar se o tenant já tem categorias
        SET @cat_count = (SELECT COUNT(*) FROM categorias_despesas WHERE tenant_id = tenant_id);
        
        IF @cat_count = 0 THEN
            -- Criar categorias padrão para o tenant
            INSERT INTO categorias_despesas (nome, descricao, cor, tenant_id) VALUES
            ('Alimentação', 'Despesas com alimentação', '#FF6B6B', tenant_id),
            ('Transporte', 'Despesas com transporte', '#4ECDC4', tenant_id),
            ('Hospedagem', 'Despesas com hospedagem', '#45B7D1', tenant_id),
            ('Material de Escritório', 'Despesas com material de escritório', '#96CEB4', tenant_id),
            ('Serviços', 'Despesas com serviços', '#FFEAA7', tenant_id),
            ('Impostos', 'Despesas com impostos', '#DDA0DD', tenant_id),
            ('Outros', 'Outras despesas', '#B0B0B0', tenant_id);
        END IF;
        
    END LOOP;
    
    CLOSE tenant_cursor;
END$$
DELIMITER ;

-- Executar criação de dados de exemplo
CALL create_sample_data_for_tenants();
DROP PROCEDURE IF EXISTS create_sample_data_for_tenants;

-- 7. Relatório final
SELECT 
    'Migração concluída!' as Status,
    COUNT(DISTINCT t.id) as 'Total de Tenants',
    COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as 'Admins',
    COUNT(DISTINCT CASE WHEN u.role != 'admin' THEN u.id END) as 'Usuários Regulares'
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
WHERE t.active = TRUE;

-- Mostrar resumo dos tenants criados
SELECT 
    t.id,
    t.name as 'Tenant',
    t.slug,
    u.name as 'Usuário',
    u.email,
    u.role as 'Papel'
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
ORDER BY t.id, u.id;