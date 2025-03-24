const Database = require('better-sqlite3');

// SQLite数据库配置
const dbPath = process.env.DB_PATH || './contracts.db';

// 初始化SQLite数据库连接
const client = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

const createContract = async (contractData) => {
  // 参数验证
  if (!contractData.title) {
    throw new Error('合同标题是必填项');
  }

  try {
    const stmt = client.prepare(
      'INSERT INTO contracts (contract_name, client_name, amount) VALUES (?, ?, ?) RETURNING *'
    );
    const res = stmt.run(contractData.title, '测试客户', 1000);
    return res.rows[0];
  } catch (err) {
    throw err;
  }
};

module.exports = { client, createContract };

// 创建核心表结构
const createTables = () => {
  try {
    client.exec(`
      CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        amount REAL CHECK (amount > 0),
        sign_date TEXT DEFAULT CURRENT_DATE,
        approval_status TEXT CHECK (approval_status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
        file_path TEXT,
        payment_date TEXT,
        milestone_status TEXT DEFAULT '未开始',
        payment_cycle INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff'
      );

      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

createTables();