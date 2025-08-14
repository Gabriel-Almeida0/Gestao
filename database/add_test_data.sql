-- Add test data for reports
USE gestao_financeira;

-- Insert some test attendants
INSERT INTO atendentes (user_id, name, commission_rate) VALUES
(1, 'João Silva', 10.00),
(1, 'Maria Santos', 12.00),
(1, 'Pedro Costa', 8.00)
ON DUPLICATE KEY UPDATE id=id;

-- Insert some test tripeiros
INSERT INTO tripeiros (user_id, name, phone, email) VALUES
(1, 'Carlos Oliveira', '11987654321', 'carlos@email.com'),
(1, 'Ana Paula', '11976543210', 'ana@email.com'),
(1, 'Roberto Lima', '11965432109', 'roberto@email.com')
ON DUPLICATE KEY UPDATE id=id;

-- Insert test payments for current month
INSERT INTO pagamentos (user_id, atendente_id, tripeiro_id, amount, commission_amount, payment_date, payment_method, description, status) VALUES
(1, 1, 1, 1500.00, 150.00, DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'Dinheiro', 'Venda produto A', 'completed'),
(1, 1, 2, 2000.00, 200.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Cartão', 'Venda produto B', 'completed'),
(1, 2, 1, 3500.00, 420.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'PIX', 'Venda produto C', 'completed'),
(1, 2, 3, 1200.00, 144.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Dinheiro', 'Venda produto D', 'completed'),
(1, 3, 2, 800.00, 64.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Cartão', 'Venda produto E', 'pending'),
(1, 3, 3, 2500.00, 200.00, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'PIX', 'Venda produto F', 'completed');

-- Insert test payments for last month
INSERT INTO pagamentos (user_id, atendente_id, tripeiro_id, amount, commission_amount, payment_date, payment_method, description, status) VALUES
(1, 1, 1, 1800.00, 180.00, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'Dinheiro', 'Venda produto G', 'completed'),
(1, 2, 2, 2200.00, 264.00, DATE_SUB(CURDATE(), INTERVAL 35 DAY), 'Cartão', 'Venda produto H', 'completed'),
(1, 3, 3, 1600.00, 128.00, DATE_SUB(CURDATE(), INTERVAL 40 DAY), 'PIX', 'Venda produto I', 'completed');

-- Insert test expenses for current month
INSERT INTO despesas (user_id, description, amount, category, expense_date) VALUES
(1, 'Aluguel', 2000.00, 'Fixo', DATE_SUB(CURDATE(), INTERVAL 0 DAY)),
(1, 'Energia elétrica', 350.00, 'Utilidades', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(1, 'Internet', 150.00, 'Utilidades', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(1, 'Material de escritório', 450.00, 'Suprimentos', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(1, 'Combustível', 300.00, 'Transporte', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(1, 'Manutenção equipamentos', 800.00, 'Manutenção', DATE_SUB(CURDATE(), INTERVAL 7 DAY));

-- Insert test expenses for last month
INSERT INTO despesas (user_id, description, amount, category, expense_date) VALUES
(1, 'Aluguel', 2000.00, 'Fixo', DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
(1, 'Energia elétrica', 320.00, 'Utilidades', DATE_SUB(CURDATE(), INTERVAL 32 DAY)),
(1, 'Internet', 150.00, 'Utilidades', DATE_SUB(CURDATE(), INTERVAL 35 DAY)),
(1, 'Material de limpeza', 280.00, 'Suprimentos', DATE_SUB(CURDATE(), INTERVAL 38 DAY));

-- Show summary
SELECT 'Dados de teste inseridos com sucesso!' as message;
SELECT COUNT(*) as total_payments FROM pagamentos WHERE user_id = 1;
SELECT COUNT(*) as total_expenses FROM despesas WHERE user_id = 1;
SELECT SUM(amount) as total_revenue FROM pagamentos WHERE user_id = 1 AND status = 'completed';
SELECT SUM(amount) as total_expenses FROM despesas WHERE user_id = 1;