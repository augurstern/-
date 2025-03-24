const request = require('supertest');
const { app } = require('../../index');
const { createContract } = require('../db');
const { Client } = require('pg');

// 为测试创建PostgreSQL客户端
const testClient = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'test_contract_management'
});

// 初始化测试数据库
const asyncCreateContract = async (data) => {
  try {
    const res = await testClient.query(
      'INSERT INTO contracts (contract_name, client_name, amount, approval_status) VALUES ($1, $2, $3, $4) RETURNING *',
      [data.title, '测试客户', 1000, 'draft']
    );
    return res.rows[0];
  } catch (err) {
    throw err;
  }
};

// 直接使用端口3100，避免与运行中的程序冲突
const PORT = 3100;
const server = app.listen(PORT);

afterAll((done) => {
  if (testClient) {
    await testClient.end();
  }
  server.close(done);
});

describe('Contracts API', () => {
  beforeAll(async () => {
    // 初始化测试数据库
    await testClient.connect();
    await testClient.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        contract_name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        amount REAL CHECK (amount > 0),
        sign_date DATE DEFAULT CURRENT_DATE,
        approval_status TEXT CHECK (approval_status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
        file_path TEXT,
        payment_date DATE,
        milestone_status TEXT DEFAULT '未开始',
        payment_cycle INTEGER DEFAULT 1
      );
    `);

    // 注入测试客户端
    app.locals.testClient = testClient;
  });

  test('POST /api/contracts 应该成功创建合同', async () => {
    const mockContract = {
      title: '采购合同',
      content: '测试内容',
      parties: ['甲方', '乙方']
    };

    const response = await request(app)
      .post('/api/contracts')
      .send(mockContract);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  test('POST /api/contracts 应该验证必要参数', async () => {
    const response = await request(app)
      .post('/api/contracts')
      .send({}); // 不提供title字段

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('PUT /api/contracts/:id/approval 应正确处理状态流转', async () => {
    // 使用自定义createContract创建测试合同
    const contract = await asyncCreateContract({ title: '状态测试合同' });
    
    console.log('创建的测试合同ID:', contract.id);

    // 测试草稿 -> 生效
    let response = await request(app)
      .put(`/api/contracts/${contract.id}/approval`)
      .send({ status: 'active' });
      
    console.log('状态更新响应:', response.body);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('affectedChanges');

    // 测试生效 -> 归档
    response = await request(app)
      .put(`/api/contracts/${contract.id}/approval`)
      .send({ status: 'archived' });
    expect(response.statusCode).toBe(200);

    // 测试非法状态转换
    response = await request(app)
      .put(`/api/contracts/${contract.id}/approval`)
      .send({ status: 'invalid' });
    expect(response.statusCode).toBe(400);
  });
});