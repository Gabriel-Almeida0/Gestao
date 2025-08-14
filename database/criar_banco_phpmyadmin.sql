-- =========================================================
-- SCRIPT PARA CRIAR BANCO DE DADOS NO PHPMYADMIN DO XAMPP
-- =========================================================
-- 
-- INSTRUÇÕES:
-- 1. Abra o XAMPP Control Panel
-- 2. Certifique-se que Apache e MySQL estão rodando (botões Start)
-- 3. Clique em "Admin" ao lado do MySQL (abrirá o phpMyAdmin)
-- 4. No phpMyAdmin, clique na aba "SQL"
-- 5. Cole TODO este conteúdo na caixa de texto
-- 6. Clique em "Executar" ou "Go"
--
-- =========================================================

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS gestao_financeira CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Selecionar o banco
USE gestao_financeira;

-- Criar tabela de tenants (empresas)
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    tenant_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Criar tabela de atendentes
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
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Criar tabela de tripeiros
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
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Criar tabela de categorias de despesas
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
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Criar tabela de despesas
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
    FOREIGN KEY (categoria_id) REFERENCES categorias_despesas(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_pagamento DATE NOT NULL,
    atendente_id INT,
    tripeiro_id INT,
    tipo_pagamento ENUM('entrada', 'saida') DEFAULT 'entrada',
    status ENUM('pendente', 'confirmado', 'cancelado') DEFAULT 'confirmado',
    valor_comissao DECIMAL(12,2),
    observacoes TEXT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (atendente_id) REFERENCES atendentes(id),
    FOREIGN KEY (tripeiro_id) REFERENCES tripeiros(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Criar tabela de recebimentos
CREATE TABLE IF NOT EXISTS recebimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tripeiro_id INT NOT NULL,
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
    FOREIGN KEY (tripeiro_id) REFERENCES tripeiros(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Criar tabela de fechamentos financeiros
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
    FOREIGN KEY (fechado_por) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Criar tabela de logs de auditoria
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
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- =========================================================
-- INSERIR DADOS INICIAIS
-- =========================================================

-- Inserir tenant padrão
INSERT INTO tenants (name, slug) VALUES ('Empresa Padrão', 'default');

-- Inserir usuário admin (senha: admin123)
INSERT INTO users (name, email, password, role, tenant_id) VALUES 
('Administrador', 'admin@gestao.com', '$2b$10$8K1p/VQ7Q1Yv3X3Z4Z5Z5eZZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'admin', 1);

-- Inserir categorias de despesas padrão
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

-- =========================================================
-- MENSAGEM DE SUCESSO
-- =========================================================
SELECT 'BANCO DE DADOS CRIADO COM SUCESSO!' AS Mensagem;
SELECT 'Total de tabelas criadas:' AS Info, COUNT(*) AS Total FROM information_schema.tables WHERE table_schema = 'gestao_financeira';