-- Script para corrigir o login do sistema
-- Execute este script no phpMyAdmin

USE gestao_financeira;

-- Primeiro, vamos deletar usuários admin existentes
DELETE FROM users WHERE email = 'admin@gestao.com';

-- Criar usuário admin com senha correta (admin123)
INSERT INTO users (name, email, password, role, tenant_id) VALUES 
('Administrador', 'admin@gestao.com', '$2b$10$Aesb/h8JlQHS1YNGeN3vruQQjijsK.13Vn4UvXEKDw0SMe/8r/HXW', 'admin', 1);

-- Verificar se foi criado
SELECT id, name, email, role, tenant_id FROM users WHERE email = 'admin@gestao.com';

-- Mensagem de sucesso
SELECT 'Usuário admin criado/atualizado com sucesso!' AS Status;
SELECT 'Use estas credenciais para login:' AS Info;
SELECT 'Email: admin@gestao.com' AS Credencial1;
SELECT 'Senha: admin123' AS Credencial2;