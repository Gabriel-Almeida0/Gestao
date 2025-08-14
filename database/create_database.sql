-- Script para criar o banco de dados e tabelas do Sistema de Gestão Financeira
-- Execute este script no MySQL com o comando:
-- mysql -u root < create_database.sql

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS gestao_financeira CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gestao_financeira;

-- Tabela de usuários (para multi-tenancy e autenticação)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    tenant_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id),
    INDEX idx_email (email)
);

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

-- Tabela de atendentes
CREATE TABLE IF NOT EXISTS atendentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    comissao_percentual DECIMAL(5,2) DEFAULT 10.00,
    ativo BOOLEAN DEFAULT TRUE,
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

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_despesa DATE NOT NULL,
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
    FOREIGN KEY (tripeiro_id) REFERENCES tripeiros(id),
    FOREIGN KEY (conta_tripeiro_id) REFERENCES contas_tripeiros(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
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

-- Inserir dados iniciais
INSERT INTO tenants (name, slug) VALUES ('Empresa Padrão', 'default');

INSERT INTO users (name, email, password, role, tenant_id) VALUES 
('Administrador', 'admin@gestao.com', '$2b$10$YourHashedPasswordHere', 'admin', 1);

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
('Outros', 'Outras despesas não categorizadas', '#D3D3D3', 1);

-- Criar views úteis para relatórios
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

CREATE OR REPLACE VIEW v_despesas_detalhado AS
SELECT 
    d.*,
    c.nome as categoria_nome,
    c.cor as categoria_cor
FROM despesas d
LEFT JOIN categorias_despesas c ON d.categoria_id = c.id
WHERE d.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_recebimentos_detalhado AS
SELECT 
    r.*,
    t.nome as tripeiro_nome,
    ct.descricao as conta_descricao
FROM recebimentos r
LEFT JOIN tripeiros t ON r.tripeiro_id = t.id
LEFT JOIN contas_tripeiros ct ON r.conta_tripeiro_id = ct.id
WHERE r.deleted_at IS NULL;

-- Criar índices adicionais para performance
CREATE INDEX idx_pagamentos_periodo ON pagamentos(data_pagamento, tenant_id, status);
CREATE INDEX idx_despesas_periodo ON despesas(data_despesa, tenant_id, status);
CREATE INDEX idx_recebimentos_periodo ON recebimentos(data_recebimento, tenant_id, status);

SHOW TABLES;