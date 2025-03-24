const { getDatabase } = require('../db');
const fs = require('fs');

describe('Database connection', () => {
  let dbInstance;

  beforeAll(async () => {
    console.log('Initializing test database...');
    if (fs.existsSync('test-db.sqlite')) {
      fs.unlinkSync('test-db.sqlite');
    }
    dbInstance = getDatabase(':memory:');
    // 注释掉读取迁移文件的代码，避免重复创建表结构
    // dbInstance.exec(fs.readFileSync('migrations/2024061501_create_payment_plans.sql', 'utf8'));
    // 创建合同表结构
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        amount REAL CHECK(amount > 0),
        sign_date DATE DEFAULT CURRENT_DATE,
        approval_status TEXT CHECK(approval_status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
        file_path TEXT,
        payment_date DATE,
        milestone_status TEXT DEFAULT '未开始',
        payment_cycle INTEGER DEFAULT 1
      );
    `);
    console.log('Database connection established');
  });

  afterAll(() => {
    console.log('Closing database connection...');
    dbInstance.close();
    console.log('Connection closed');
  });

  test('should connect to test database', async () => {
    console.log('Current connection status:', dbInstance.open ? 'connected' : 'disconnected');
    await expect(dbInstance.open).toBe(true);
  });

  test('数据库事务应支持提交和回滚', async () => {
    const transaction = dbInstance.prepare('BEGIN TRANSACTION');
    const insert = dbInstance.prepare('INSERT INTO contracts (contract_name, client_name, amount) VALUES (?, ?, ?)');
    
    // 测试事务回滚
    transaction.run();
    insert.run('临时合同', '测试客户', 1000);
    dbInstance.prepare('ROLLBACK').run();
    
    const countAfterRollback = dbInstance.prepare('SELECT COUNT(*) FROM contracts').get();
    expect(countAfterRollback['COUNT(*)']).toBe(0);

    // 测试事务提交
    transaction.run();
    insert.run('正式合同', '测试客户', 1000);
    dbInstance.prepare('COMMIT').run();
    
    const countAfterCommit = dbInstance.prepare('SELECT COUNT(*) FROM contracts').get();
    expect(countAfterCommit['COUNT(*)']).toBe(1);
  });
});