/**
 * 合同API端到端测试
 */
const request = require('supertest');
const express = require('express');
const contractsRouter = require('../../routes/contracts');
const Database = require('better-sqlite3');

// 创建测试数据库和应用
let app;
let testDb;

beforeAll(() => {
  // 创建内存数据库用于测试
  testDb = new Database(':memory:');
  
  // 创建测试表
  testDb.exec(`
    CREATE TABLE contracts (
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
  `);
  
  // 插入测试数据
  const insertStmt = testDb.prepare(`
    INSERT INTO contracts (contract_name, client_name, amount, sign_date, approval_status)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertStmt.run('测试合同1', '测试客户1', 10000, '2024-06-01', 'draft');
  insertStmt.run('测试合同2', '测试客户2', 20000, '2024-06-02', 'active');
  
  // 创建Express应用
  app = express();
  app.use(express.json());
  
  // 注入测试数据库
  app.locals.testDb = testDb;
  
  // 注册合同路由
  app.use('/api/contracts', contractsRouter);
  
  // 添加错误处理中间件
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message
    });
  });
});

afterAll(() => {
  // 关闭测试数据库连接
  if (testDb) {
    testDb.close();
  }
});

describe('合同API测试', () => {
  // 测试获取合同列表
  test('GET /api/contracts - 应返回合同列表', async () => {
    const response = await request(app).get('/api/contracts');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body.items.length).toBeGreaterThanOrEqual(2);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
  });
  
  // 测试获取单个合同
  test('GET /api/contracts/:id - 应返回单个合同', async () => {
    const response = await request(app).get('/api/contracts/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('contract_name');
    expect(response.body).toHaveProperty('client_name');
  });
  
  // 测试获取不存在的合同
  test('GET /api/contracts/:id - 不存在的合同应返回404', async () => {
    const response = await request(app).get('/api/contracts/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', '合同不存在');
  });
  
  // 测试创建合同
  test('POST /api/contracts - 应创建新合同', async () => {
    const newContract = {
      title: '新测试合同',
      parties: '新测试客户',
      amount: 30000,
      sign_date: '2024-06-15'
    };
    
    const response = await request(app)
      .post('/api/contracts')
      .send(newContract);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('contract_name', '新测试合同');
    expect(response.body).toHaveProperty('client_name', '新测试客户');
    expect(response.body).toHaveProperty('amount', 30000);
  });
  
  // 测试创建合同时的数据验证
  test('POST /api/contracts - 缺少必填字段应返回400', async () => {
    const invalidContract = {
      // 缺少title和parties
      amount: 5000
    };
    
    const response = await request(app)
      .post('/api/contracts')
      .send(invalidContract);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
  });
  
  // 测试更新合同
  test('PUT /api/contracts/:id - 应更新合同', async () => {
    const updateData = {
      contract_name: '更新后的合同名称',
      amount: 15000
    };
    
    const response = await request(app)
      .put('/api/contracts/1')
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('contract_name', '更新后的合同名称');
    expect(response.body).toHaveProperty('amount', 15000);
  });
  
  // 测试删除合同
  test('DELETE /api/contracts/:id - 应删除合同', async () => {
    const response = await request(app).delete('/api/contracts/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    
    // 验证合同已被删除
    const getResponse = await request(app).get('/api/contracts/2');
    expect(getResponse.status).toBe(404);
  });
});