const { pool } = require('../config/database');

async function seedData() {
  try {
    console.log('Starting data seeding...');
    
    // Insert test attendants
    await pool.execute(`
      INSERT INTO atendentes (user_id, name, commission_rate) VALUES
      (1, 'João Silva', 10.00),
      (1, 'Maria Santos', 12.00),
      (1, 'Pedro Costa', 8.00)
      ON DUPLICATE KEY UPDATE id=id
    `);
    console.log('✓ Attendants inserted');

    // Insert test tripeiros
    await pool.execute(`
      INSERT INTO tripeiros (user_id, name, phone, email) VALUES
      (1, 'Carlos Oliveira', '11987654321', 'carlos@email.com'),
      (1, 'Ana Paula', '11976543210', 'ana@email.com'),
      (1, 'Roberto Lima', '11965432109', 'roberto@email.com')
      ON DUPLICATE KEY UPDATE id=id
    `);
    console.log('✓ Tripeiros inserted');

    // Get IDs
    const [attendants] = await pool.execute('SELECT id FROM atendentes WHERE user_id = 1 LIMIT 3');
    const [tripeiros] = await pool.execute('SELECT id FROM tripeiros WHERE user_id = 1 LIMIT 3');

    if (attendants.length > 0 && tripeiros.length > 0) {
      // Insert test payments for current month
      const currentDate = new Date();
      for (let i = 0; i < 10; i++) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const amount = 1000 + Math.random() * 3000;
        const attendantId = attendants[i % attendants.length].id;
        const tripeiroId = tripeiros[i % tripeiros.length].id;
        const commission = amount * 0.1;
        const status = i % 3 === 0 ? 'pending' : 'completed';
        
        await pool.execute(`
          INSERT INTO pagamentos (user_id, atendente_id, tripeiro_id, amount, commission_amount, payment_date, payment_method, description, status) 
          VALUES (1, ?, ?, ?, ?, ?, 'PIX', 'Venda teste ${i}', ?)
        `, [attendantId, tripeiroId, amount.toFixed(2), commission.toFixed(2), dateStr, status]);
      }
      console.log('✓ Payments inserted');

      // Insert test payments for previous months
      for (let month = 1; month <= 5; month++) {
        for (let i = 0; i < 5; i++) {
          const date = new Date(currentDate);
          date.setMonth(date.getMonth() - month);
          date.setDate(Math.floor(Math.random() * 28) + 1);
          const dateStr = date.toISOString().split('T')[0];
          
          const amount = 1000 + Math.random() * 3000;
          const attendantId = attendants[i % attendants.length].id;
          const tripeiroId = tripeiros[i % tripeiros.length].id;
          const commission = amount * 0.1;
          
          await pool.execute(`
            INSERT INTO pagamentos (user_id, atendente_id, tripeiro_id, amount, commission_amount, payment_date, payment_method, description, status) 
            VALUES (1, ?, ?, ?, ?, ?, 'Cartão', 'Venda histórica', 'completed')
          `, [attendantId, tripeiroId, amount.toFixed(2), commission.toFixed(2), dateStr]);
        }
      }
      console.log('✓ Historical payments inserted');
    }

    // Insert test expenses
    const categories = ['Fixo', 'Utilidades', 'Suprimentos', 'Transporte', 'Manutenção', 'Marketing'];
    const currentDate2 = new Date();
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(currentDate2);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const amount = 200 + Math.random() * 1500;
      const category = categories[i % categories.length];
      
      await pool.execute(`
        INSERT INTO despesas (user_id, description, amount, category, expense_date) 
        VALUES (1, 'Despesa ${category} ${i}', ?, ?, ?)
      `, [amount.toFixed(2), category, dateStr]);
    }
    console.log('✓ Expenses inserted');

    // Insert historical expenses
    for (let month = 1; month <= 5; month++) {
      for (let i = 0; i < 8; i++) {
        const date = new Date(currentDate2);
        date.setMonth(date.getMonth() - month);
        date.setDate(Math.floor(Math.random() * 28) + 1);
        const dateStr = date.toISOString().split('T')[0];
        
        const amount = 200 + Math.random() * 1500;
        const category = categories[i % categories.length];
        
        await pool.execute(`
          INSERT INTO despesas (user_id, description, amount, category, expense_date) 
          VALUES (1, 'Despesa histórica ${category}', ?, ?, ?)
        `, [amount.toFixed(2), category, dateStr]);
      }
    }
    console.log('✓ Historical expenses inserted');

    // Show summary
    const [revenue] = await pool.execute('SELECT SUM(amount) as total FROM pagamentos WHERE user_id = 1 AND status = "completed"');
    const [expenses] = await pool.execute('SELECT SUM(amount) as total FROM despesas WHERE user_id = 1');
    const [paymentCount] = await pool.execute('SELECT COUNT(*) as count FROM pagamentos WHERE user_id = 1');
    const [expenseCount] = await pool.execute('SELECT COUNT(*) as count FROM despesas WHERE user_id = 1');

    console.log('\n=== Summary ===');
    console.log(`Total Payments: ${paymentCount[0].count}`);
    console.log(`Total Expenses: ${expenseCount[0].count}`);
    console.log(`Total Revenue: R$ ${parseFloat(revenue[0].total || 0).toFixed(2)}`);
    console.log(`Total Expenses: R$ ${parseFloat(expenses[0].total || 0).toFixed(2)}`);
    console.log(`Net Profit: R$ ${(parseFloat(revenue[0].total || 0) - parseFloat(expenses[0].total || 0)).toFixed(2)}`);
    
    console.log('\n✅ Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();