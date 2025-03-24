import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ApprovalFlow from '../ApprovalFlow.vue'
import { ElButton, ElStep, ElSteps, ElMessage } from 'element-plus'

describe('ApprovalFlow边界测试', () => {
  it('非法状态转换应抛出错误', async () => {
    // Mock Fetch API
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: '操作失败' })
    });
    
    const wrapper = mount(ApprovalFlow, {
      props: {
        contractId: 'test-1'
      },
      global: {
        plugins: [ElButton, ElStep, ElSteps]
      }
    });
    
    // 尝试非法的状态转换
    await wrapper.find('.el-button').trigger('click');
    await wrapper.vm.$nextTick();
    
    // 查找错误消息
    expect(wrapper.find('[data-test="error-message"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="error-message"]').text()).toContain('状态更新失败');
  });

  it('空审批人提交应触发错误', async () => {
    // Mock Fetch API
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: '审批人不能为空' })
    });
    
    const wrapper = mount(ApprovalFlow, {
      global: {
        plugins: [ElButton, ElStep, ElSteps],
        mocks: {
          $message: ElMessage
        }
      },
      props: {
        contractId: '1'
      }
    });
    
    // 点击提交按钮
    await wrapper.find('.el-button').trigger('click');
    await wrapper.vm.$nextTick();
    
    // 验证错误信息
    expect(wrapper.emitted('status-change')).toBeUndefined();
    const errorMessage = wrapper.find('[data-test="error-message"]');
    expect(errorMessage.exists()).toBe(true);
    expect(errorMessage.text()).toContain('状态更新失败');
  });
})