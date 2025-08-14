-- Adicionar coluna categoria nas despesas se não existir
ALTER TABLE despesas 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Geral' AFTER data_despesa;

-- Adicionar colunas faltantes em tripeiros
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
    FOREIGN KEY (tripeiro_id) REFERENCES tripeiros(id)
);

-- Atualizar status em recebimentos para ter os valores corretos
ALTER TABLE recebimentos 
MODIFY COLUMN status ENUM('pendente', 'confirmado', 'cancelado') DEFAULT 'confirmado';