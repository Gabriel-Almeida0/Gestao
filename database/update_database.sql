-- Script para atualizar o banco de dados
-- Execute no phpMyAdmin após criar o banco

USE gestao_financeira;

-- Adicionar coluna is_active na tabela users (caso não exista)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE AFTER role;

-- Atualizar senha do admin para 'admin123' (hash bcrypt)
UPDATE users 
SET password = '$2b$10$XKvhqfWrZ6vQhZKPgRpxkOm0vlEjhZF7Y3L9p8DQH5zNc3aXNqWGC' 
WHERE email = 'admin@gestao.com';

-- Verificar se o usuário admin existe, se não, criar
INSERT INTO users (name, email, password, role, is_active, tenant_id)
SELECT 'Administrador', 'admin@gestao.com', '$2b$10$XKvhqfWrZ6vQhZKPgRpxkOm0vlEjhZF7Y3L9p8DQH5zNc3aXNqWGC', 'admin', TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gestao.com');

-- Adicionar alguns dados de exemplo
-- Adicionar atendentes
INSERT INTO atendentes (nome, telefone, email, comissao_percentual, tenant_id)
SELECT 'João Silva', '11999999999', 'joao@example.com', 10.00, 1
WHERE NOT EXISTS (SELECT 1 FROM atendentes WHERE email = 'joao@example.com');

INSERT INTO atendentes (nome, telefone, email, comissao_percentual, tenant_id)
SELECT 'Maria Santos', '11888888888', 'maria@example.com', 15.00, 1
WHERE NOT EXISTS (SELECT 1 FROM atendentes WHERE email = 'maria@example.com');

-- Adicionar tripeiros
INSERT INTO tripeiros (nome, documento, telefone, email, endereco, tenant_id)
SELECT 'Carlos Oliveira', '12345678901', '11777777777', 'carlos@example.com', 'Rua A, 123', 1
WHERE NOT EXISTS (SELECT 1 FROM tripeiros WHERE documento = '12345678901');

INSERT INTO tripeiros (nome, documento, telefone, email, endereco, tenant_id)
SELECT 'Ana Costa', '98765432109', '11666666666', 'ana@example.com', 'Rua B, 456', 1
WHERE NOT EXISTS (SELECT 1 FROM tripeiros WHERE documento = '98765432109');

-- Mensagem de sucesso
SELECT 'Banco de dados atualizado com sucesso!' AS Mensagem;
SELECT 'Credenciais de login:' AS Info, 'admin@gestao.com / admin123' AS Dados;