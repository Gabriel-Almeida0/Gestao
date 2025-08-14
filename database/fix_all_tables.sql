-- =========================================================
-- SCRIPT PARA CORRIGIR TODAS AS TABELAS DO BANCO
-- =========================================================
-- 
-- INSTRUÇÕES:
-- 1. Abra o phpMyAdmin através do XAMPP
-- 2. Selecione o banco de dados 'gestao_financeira'
-- 3. Clique na aba "SQL"
-- 4. Cole TODO este conteúdo na caixa de texto
-- 5. Clique em "Executar" ou "Go"
--
-- =========================================================

USE gestao_financeira;

-- Criar tabela de notas SE NÃO EXISTIR
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

-- Criar tabela de lembretes SE NÃO EXISTIR
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

-- Adicionar coluna categoria nas despesas se não existir
ALTER TABLE despesas 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Geral' AFTER data_despesa;

-- Adicionar colunas faltantes em tripeiros se não existirem
ALTER TABLE tripeiros
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100) AFTER endereco,
ADD COLUMN IF NOT EXISTS estado VARCHAR(2) AFTER cidade,
ADD COLUMN IF NOT EXISTS cep VARCHAR(10) AFTER estado;

-- Adicionar coluna observacoes em atendentes se não existir
ALTER TABLE atendentes
ADD COLUMN IF NOT EXISTS observacoes TEXT AFTER ativo;

-- Criar tabela contas_tripeiro se não existir
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

-- Criar tabela recebimentos se não existir
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
    FOREIGN KEY (tripeiro_id) REFERENCES tripeiros(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Verificar estrutura das tabelas
SHOW TABLES;

-- Verificar se as colunas foram adicionadas
DESCRIBE notes;
DESCRIBE reminders;
DESCRIBE despesas;

-- Mensagem de sucesso
SELECT 'Todas as tabelas foram verificadas e atualizadas com sucesso!' AS Status;