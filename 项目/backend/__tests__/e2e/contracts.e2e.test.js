const request = require('supertest');
const app = require('../../index');
const db = require('../../src/db');

describe('合同全流程测试', () => {
  beforeEach(() => {
    // 清空测试数据
    db.client.prepare('DELETE FROM contracts').run();
    db.client.prepare('DELETE FROM payment_plans').run();
  });

  test('创建合同及支付计划校验', async () => {
    // 创建新合同
    const contractRes = await request(app)
      .post('/api/contracts')
      .send({ title: '测试合同', amount: 10000 });

    // 创建支付计划
    const paymentRes = await request(app)
      .post(`/contracts/${contractRes.body.id}/payment-plans`)
      .send({ amount: 5000, planned_date: new Date().toISOString() });

    // 尝试创建超额支付计划
    const invalidRes = await request(app)
      .post(`/contracts/${contractRes.body.id}/payment-plans`)
      .send({ amount: 6000, planned_date: new Date().toISOString() });

    expect(paymentRes.status).toBe(201);
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error).toMatch('支付计划总额超过合同金额');
  });
});