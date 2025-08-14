-- =========================================================
-- SCRIPT PARA ADICIONAR TABELAS DE NOTAS E LEMBRETES
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

-- Criar tabela de notas
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
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    INDEX idx_notes_tenant (tenant_id),
    INDEX idx_notes_user (user_id),
    INDEX idx_notes_pinned (is_pinned)
);

-- Criar tabela de lembretes
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
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    INDEX idx_reminders_tenant (tenant_id),
    INDEX idx_reminders_user (user_id),
    INDEX idx_reminders_due_date (due_date),
    INDEX idx_reminders_status (status),
    INDEX idx_reminders_priority (priority)
);

-- Inserir algumas notas de exemplo
INSERT INTO notes (title, content, is_pinned, user_id, tenant_id) VALUES
('Bem-vindo ao Sistema', 'Este é o sistema de gestão financeira. Use esta área para adicionar notas importantes.', TRUE, 1, 1),
('Dica do Sistema', 'Você pode fixar notas importantes para que elas apareçam sempre no topo.', FALSE, 1, 1);

-- Inserir alguns lembretes de exemplo
INSERT INTO reminders (title, description, due_date, priority, status, user_id, tenant_id) VALUES
('Revisar relatório mensal', 'Verificar o fechamento financeiro do mês anterior', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'high', 'pending', 1, 1),
('Backup do sistema', 'Realizar backup completo do banco de dados', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'medium', 'pending', 1, 1);

-- Verificar se as tabelas foram criadas
SELECT 'Tabelas criadas com sucesso!' AS Status;
SELECT COUNT(*) AS total_notes FROM notes;
SELECT COUNT(*) AS total_reminders FROM reminders;