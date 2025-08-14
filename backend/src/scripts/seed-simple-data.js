const { pool } = require('../config/database');

async function seedSimpleData() {
  try {
    console.log('Inserindo dados de teste simples...\n');
    
    // Inserir alguns pagamentos de teste diretamente
    const tenantId = 1;
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log('1. Inserindo pagamentos de teste...');
    await pool.execute(
      `INSERT INTO pagamentos (tenant_id, valor, valor_comissao, data_pagamento, status, descricao, created_at, updated_at) 
       VALUES 
       (?, 1500.00, 150.00, ?, 'confirmado', 'Pagamento teste 1', NOW(), NOW()),
       (?, 2000.00, 200.00, ?, 'confirmado', 'Pagamento teste 2', NOW(), NOW()),
       (?, 3500.00, 350.00, ?, 'confirmado', 'Pagamento teste 3', NOW(), NOW()),
       (?, 1200.00, 120.00, ?, 'pendente', 'Pagamento teste 4', NOW(), NOW()),
       (?, 800.00, 80.00, ?, 'confirmado', 'Pagamento teste 5', NOW(), NOW())`,
      [tenantId, currentDate, tenantId, currentDate, tenantId, currentDate, tenantId, currentDate, tenantId, currentDate]
    );
    console.log('✓ Pagamentos inseridos');
    
    console.log('2. Inserindo despesas de teste...');
    await pool.execute(
      `INSERT INTO despesas (tenant_id, valor, categoria, data_despesa, descricao, created_at, updated_at) 
       VALUES 
       (?, 500.00, 'Aluguel', ?, 'Aluguel mensal', NOW(), NOW()),
       (?, 300.00, 'Utilidades', ?, 'Energia elétrica', NOW(), NOW()),
       (?, 150.00, 'Utilidades', ?, 'Internet', NOW(), NOW()),
       (?, 450.00, 'Suprimentos', ?, 'Material de escritório', NOW(), NOW()),
       (?, 200.00, 'Transporte', ?, 'Combustível', NOW(), NOW())`,
      [tenantId, currentDate, tenantId, currentDate, tenantId, currentDate, tenantId, currentDate, tenantId, currentDate]
    );
    console.log('✓ Despesas inseridas');
    
    console.log('3. Inserindo atendentes de teste...');
    await pool.execute(
      `INSERT INTO atendentes (tenant_id, nome, percentual_comissao, ativo, created_at, updated_at) 
       VALUES 
       (?, 'João Silva', 10.00, 1, NOW(), NOW()),
       (?, 'Maria Santos', 12.00, 1, NOW(), NOW()),
       (?, 'Pedro Costa', 8.00, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE nome=VALUES(nome)`,
      [tenantId, tenantId, tenantId]
    );
    console.log('✓ Atendentes inseridos');
    
    console.log('4. Inserindo tripeiros de teste...');
    await pool.execute(
      `INSERT INTO tripeiros (tenant_id, nome, telefone, email, created_at, updated_at) 
       VALUES 
       (?, 'Carlos Oliveira', '11987654321', 'carlos@email.com', NOW(), NOW()),
       (?, 'Ana Paula', '11976543210', 'ana@email.com', NOW(), NOW()),
       (?, 'Roberto Lima', '11965432109', 'roberto@email.com', NOW(), NOW())
       ON DUPLICATE KEY UPDATE nome=VALUES(nome)`,
      [tenantId, tenantId, tenantId]
    );
    console.log('✓ Tripeiros inseridos');
    
    // Verificar os totais
    console.log('\n=== Verificando dados inseridos ===');
    
    const [payments] = await pool.execute(
      'SELECT COUNT(*) as count, SUM(valor) as total FROM pagamentos WHERE tenant_id = ? AND status = "confirmado"',
      [tenantId]
    );
    console.log(`Pagamentos confirmados: ${payments[0].count} - Total: R$ ${payments[0].total}`);
    
    const [expenses] = await pool.execute(
      'SELECT COUNT(*) as count, SUM(valor) as total FROM despesas WHERE tenant_id = ?',
      [tenantId]
    );
    console.log(`Despesas: ${expenses[0].count} - Total: R$ ${expenses[0].total}`);
    
    const [attendants] = await pool.execute(
      'SELECT COUNT(*) as count FROM atendentes WHERE tenant_id = ?',
      [tenantId]
    );
    console.log(`Atendentes: ${attendants[0].count}`);
    
    const [tripeiros] = await pool.execute(
      'SELECT COUNT(*) as count FROM tripeiros WHERE tenant_id = ?',
      [tenantId]
    );
    console.log(`Tripeiros: ${tripeiros[0].count}`);
    
    console.log('\n✅ Dados de teste inseridos com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error.message);
    console.error('SQL Error:', error.sql);
    process.exit(1);
  }
}

seedSimpleData();