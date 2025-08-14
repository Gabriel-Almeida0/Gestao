const axios = require('axios');
const { pool } = require('../config/database');

async function testReportsAPI() {
  try {
    console.log('Testing Reports API...\n');
    
    // First, get a valid token
    console.log('1. Getting authentication token...');
    const loginResponse = await axios.post('http://localhost:3333/api/auth/login', {
      email: 'admin@gestao.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Token obtained:', token ? 'Yes' : 'No');
    
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    
    // Test the reports endpoint
    console.log('\n2. Testing /api/reports/generate endpoint...');
    const reportResponse = await axios.get('http://localhost:3333/api/reports/generate', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        type: 'financial',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    });
    
    console.log('✓ API Response Status:', reportResponse.status);
    console.log('\n3. Report Data Summary:');
    
    const data = reportResponse.data;
    if (data.summary) {
      console.log('  Summary:');
      console.log('    - Total Revenue:', data.summary.totalRevenue);
      console.log('    - Total Expenses:', data.summary.totalExpenses);
      console.log('    - Net Profit:', data.summary.netProfit);
      console.log('    - Total Commissions:', data.summary.totalCommissions);
      console.log('    - Confirmed Payments:', data.summary.confirmedPayments);
      console.log('    - Expense Count:', data.summary.expenseCount);
    }
    
    if (data.byCategory) {
      console.log('\n  Categories:', data.byCategory.length);
    }
    
    if (data.byAttendant) {
      console.log('  Attendants:', data.byAttendant.length);
    }
    
    if (data.byTripeiro) {
      console.log('  Tripeiros:', data.byTripeiro.length);
    }
    
    if (data.monthlyTrend) {
      console.log('  Monthly Trend Data Points:', data.monthlyTrend.length);
    }
    
    // Check database directly
    console.log('\n4. Checking database directly...');
    const [payments] = await pool.execute(
      'SELECT COUNT(*) as count, SUM(amount) as total FROM pagamentos WHERE user_id = 1 AND status = "completed"'
    );
    console.log('  Database Payments:');
    console.log('    - Count:', payments[0].count);
    console.log('    - Total:', payments[0].total);
    
    const [expenses] = await pool.execute(
      'SELECT COUNT(*) as count, SUM(amount) as total FROM despesas WHERE user_id = 1'
    );
    console.log('  Database Expenses:');
    console.log('    - Count:', expenses[0].count);
    console.log('    - Total:', expenses[0].total);
    
    console.log('\n✅ API Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  } finally {
    process.exit();
  }
}

testReportsAPI();