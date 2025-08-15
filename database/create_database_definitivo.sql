-- =========================================================
-- SCRIPT SQL DEFINITIVO PARA CRIAR O BANCO DE DADOS
-- Sistema de Gestão Financeira - Versão Completa
-- =========================================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no MySQL ou phpMyAdmin
-- 2. Este script inclui todas as correções necessárias
-- 3. Credenciais padrão: admin@gestao.com / admin123
--
-- =========================================================

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS gestao_financeira CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gestao_financeira;

-- =========================================================
-- TABELAS PRINCIPAIS
-- =========================================================

-- Tabela de tenants (empresas/organizações)
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
);

-- Tabela de usuários (para multi-tenancy e autenticação)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    tenant_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id),
    INDEX idx_email (email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tabela de atendentes
CREATE TABLE IF NOT EXISTS atendentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    comissao_percentual DECIMAL(5,2) DEFAULT 10.00,
    ativo BOOLEAN DEFAULT TRUE,
    observacoes TEXT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_tenant (tenant_id),
    INDEX idx_ativo (ativo),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tabela de tripeiros (clientes)
CREATE TABLE IF NOT EXISTS tripeiros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    documento VARCHAR(50),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_tenant (tenant_id),
    INDEX idx_documento (documento),
    INDEX idx_ativo (ativo),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tabela de contas de tripeiros
CREATE TABLE IF NOT EXISTS contas_tripeiros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tripeiro_id INT NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    numero_conta VARCHAR(100),
    banco VARCHAR(100),
    agencia VARCHAR(20),
    tipo_conta ENUM('corrente', 'poupanca', 'outro') DEFAULT 'corrente',
    ativa BOOLEAN DEFAULT TRUE,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tripeiro (tripeiro_id),
    INDEX idx_tenant (tenant_id),
    FOREIGN KEY (tripeiro_id) REFERENCES tripeiros(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tabela alternativa de contas de tripeiro (para compatibilidade)
CREATE TABLE IF NOT EXISTS contas_tripeiro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tripeiro_id INT NOT NULL,
    numero_conta VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    limite_credito DECIMAL(12,2) DEFAULT 0,
    saldo_devedor DECIMAL(12,2) DEFAULT 0,
    ativa BOOLEAN DEFAULT TRUE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (tripeiro_id) REFERENCES tripeiros(id) ON DELETE CASCADE
);

-- Tabela de categorias de despesas
CREATE TABLE IF NOT EXISTS categorias_despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#000000',
    icone VARCHAR(50),
    ativa BOOLEAN DEFAULT TRUE,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id),
    UNIQUE KEY uk_nome_tenant (nome, tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_pagamento DATE NOT NULL,
    atendente_id INT,
    tripeiro_id INT,
    conta_tripeiro_id INT,
    tipo_pagamento ENUM('entrada', 'saida') DEFAULT 'entrada',
    status ENUM('pendente', 'confirmado', 'cancelado') DEFAULT 'confirmado',
    valor_comissao DECIMAL(12,2),
    observacoes TEXT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_data (data_pagamento),
    INDEX idx_atendente (atendente_id),
    INDEX idx_tripeiro (tripeiro_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    INDEX idx_tipo (tipo_pagamento),
    FOREIGN KEY (atendente_id) REFERENCES atendentes(id),
    FOREIGN KEY (tripeiro_id) REFERENCES tripeiros(id),
    FOREIGN KEY (conta_tripeiro_id) REFERENCES contas_tripeiros(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_despesa DATE NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    categoria_id INT,
    tipo_despesa ENUM('fixa', 'variavel', 'eventual') DEFAULT 'variavel',
    status ENUM('pendente', 'paga', 'cancelada') DEFAULT 'paga',
    forma_pagamento VARCHAR(50),
    documento_fiscal VARCHAR(100),
    observacoes TEXT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_data (data_despesa),
    INDEX idx_categoria (categoria_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    FOREIGN KEY (categoria_id) REFERENCES categorias_despesas(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tabela de recebimentos
CREATE TABLE IF NOT EXISTS recebimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tripeiro_id INT NOT NULL,
    conta_tripeiro_id INT,
    valor DECIMAL(12,2) NOT NULL,
    data_recebimento DATE NOT NULL,
    tipo_recebimento ENUM('dinheiro', 'pix', 'transferencia', 'boleto', 'cartao', 'cheque', 'outro') DEFAULT 'dinheiro',
    banco_origem VARCHAR(100),
    agencia_origem VARCHAR(20),
    conta_origem VARCHAR(50),
    numero_documento VARCHAR(100),
    status ENUM('pendente', 'confirmado', 'cancelado') DEFAULT 'confirmado',
    observacoes TEXT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_data (data_recebimento),
    INDEX idx_tripeiro (tripeiro_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    FOREIGN KEY (tripeiro_id) REFERENCES tripeiros(id) ON DELETE CASCADE,
    FOREIGN KEY (conta_tripeiro_id) REFERENCES contas_tripeiros(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabela de fechamentos financeiros
CREATE TABLE IF NOT EXISTS fechamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    total_entradas DECIMAL(12,2) DEFAULT 0,
    total_saidas DECIMAL(12,2) DEFAULT 0,
    total_despesas DECIMAL(12,2) DEFAULT 0,
    total_recebimentos DECIMAL(12,2) DEFAULT 0,
    total_comissoes DECIMAL(12,2) DEFAULT 0,
    saldo_periodo DECIMAL(12,2) DEFAULT 0,
    observacoes TEXT,
    status ENUM('aberto', 'fechado', 'revisao') DEFAULT 'aberto',
    fechado_por INT,
    data_fechamento TIMESTAMP NULL,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_periodo (data_inicio, data_fim),
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    FOREIGN KEY (fechado_por) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- =========================================================
-- TABELAS ADICIONAIS (NOTAS E LEMBRETES)
-- =========================================================

-- Tabela de notas
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    color VARCHAR(7) DEFAULT '#f3f4f6',
    user_id INT NOT NULL,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_notes_tenant (tenant_id),
    INDEX idx_notes_user (user_id),
    INDEX idx_notes_pinned (is_pinned)
);

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TIME,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    category VARCHAR(100),
    user_id INT NOT NULL,
    tenant_id INT NOT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_reminders_tenant (tenant_id),
    INDEX idx_reminders_user (user_id),
    INDEX idx_reminders_due_date (due_date),
    INDEX idx_reminders_status (status),
    INDEX idx_reminders_priority (priority)
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    tenant_id INT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- =========================================================
-- DADOS INICIAIS
-- =========================================================

-- Inserir tenant padrão
INSERT INTO tenants (name, slug) VALUES ('Empresa Padrão', 'default')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Inserir usuário admin com senha correta (admin123)
INSERT INTO users (name, email, password, role, is_active, tenant_id) VALUES 
('Administrador', 'admin@gestao.com', '$2b$10$Aesb/h8JlQHS1YNGeN3vruQQjijsK.13Vn4UvXEKDw0SMe/8r/HXW', 'admin', TRUE, 1)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    is_active = VALUES(is_active);

-- Inserir categorias de despesas
INSERT INTO categorias_despesas (nome, descricao, cor, tenant_id) VALUES
('Alimentação', 'Despesas com alimentação e refeições', '#FF6B6B', 1),
('Transporte', 'Despesas com transporte e combustível', '#4ECDC4', 1),
('Material de Escritório', 'Despesas com material de escritório', '#45B7D1', 1),
('Manutenção', 'Despesas com manutenção e reparos', '#96CEB4', 1),
('Impostos', 'Despesas com impostos e taxas', '#FFEAA7', 1),
('Folha de Pagamento', 'Despesas com salários e encargos', '#DDA0DD', 1),
('Aluguel', 'Despesas com aluguel e condomínio', '#F4A460', 1),
('Utilidades', 'Despesas com água, luz, internet', '#87CEEB', 1),
('Marketing', 'Despesas com publicidade e marketing', '#FFB6C1', 1),
('Outros', 'Outras despesas não categorizadas', '#D3D3D3', 1)
ON DUPLICATE KEY UPDATE 
    descricao = VALUES(descricao),
    cor = VALUES(cor);

-- Inserir dados de exemplo para atendentes
INSERT INTO atendentes (nome, telefone, email, comissao_percentual, tenant_id) VALUES
('João Silva', '11999999999', 'joao@example.com', 10.00, 1),
('Maria Santos', '11888888888', 'maria@example.com', 15.00, 1)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Inserir dados de exemplo para tripeiros
INSERT INTO tripeiros (nome, documento, telefone, email, endereco, cidade, estado, cep, tenant_id) VALUES
('Carlos Oliveira', '12345678901', '11777777777', 'carlos@example.com', 'Rua A, 123', 'São Paulo', 'SP', '01234-567', 1),
('Ana Costa', '98765432109', '11666666666', 'ana@example.com', 'Rua B, 456', 'São Paulo', 'SP', '09876-543', 1)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Inserir notas de exemplo
INSERT INTO notes (title, content, is_pinned, user_id, tenant_id) VALUES
('Bem-vindo ao Sistema', 'Este é o sistema de gestão financeira. Use esta área para adicionar notas importantes.', TRUE, 1, 1),
('Dica do Sistema', 'Você pode fixar notas importantes para que elas apareçam sempre no topo.', FALSE, 1, 1)
ON DUPLICATE KEY UPDATE content = VALUES(content);

-- Inserir lembretes de exemplo
INSERT INTO reminders (title, description, due_date, priority, status, user_id, tenant_id) VALUES
('Revisar relatório mensal', 'Verificar o fechamento financeiro do mês anterior', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'high', 'pending', 1, 1),
('Backup do sistema', 'Realizar backup completo do banco de dados', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'medium', 'pending', 1, 1)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- =========================================================
-- VIEWS PARA RELATÓRIOS
-- =========================================================

-- View de pagamentos detalhado
CREATE OR REPLACE VIEW v_pagamentos_detalhado AS
SELECT 
    p.*,
    a.nome as atendente_nome,
    t.nome as tripeiro_nome,
    ct.descricao as conta_descricao
FROM pagamentos p
LEFT JOIN atendentes a ON p.atendente_id = a.id
LEFT JOIN tripeiros t ON p.tripeiro_id = t.id
LEFT JOIN contas_tripeiros ct ON p.conta_tripeiro_id = ct.id
WHERE p.deleted_at IS NULL;

-- View de despesas detalhado
CREATE OR REPLACE VIEW v_despesas_detalhado AS
SELECT 
    d.*,
    c.nome as categoria_nome,
    c.cor as categoria_cor
FROM despesas d
LEFT JOIN categorias_despesas c ON d.categoria_id = c.id
WHERE d.deleted_at IS NULL;

-- View de recebimentos detalhado
CREATE OR REPLACE VIEW v_recebimentos_detalhado AS
SELECT 
    r.*,
    t.nome as tripeiro_nome,
    ct.descricao as conta_descricao
FROM recebimentos r
LEFT JOIN tripeiros t ON r.tripeiro_id = t.id
LEFT JOIN contas_tripeiros ct ON r.conta_tripeiro_id = ct.id
WHERE r.deleted_at IS NULL;

-- =========================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_pagamentos_periodo ON pagamentos(data_pagamento, tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_despesas_periodo ON despesas(data_despesa, tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_recebimentos_periodo ON recebimentos(data_recebimento, tenant_id, status);

-- =========================================================
-- VERIFICAÇÕES FINAIS
-- =========================================================

-- Mostrar tabelas criadas
SHOW TABLES;

-- Verificar usuário admin
SELECT id, name, email, role, is_active, tenant_id FROM users WHERE email = 'admin@gestao.com';

-- Mensagens de sucesso
SELECT 'Banco de dados criado com sucesso!' AS Status;
SELECT 'Todas as correções foram aplicadas!' AS Info;
SELECT 'Credenciais de acesso:' AS Login_Info;
SELECT 'Email: admin@gestao.com' AS Email;
SELECT 'Senha: admin123' AS Senha;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'gestao_financeira';