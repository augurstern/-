import { mount } from '@vue/test-utils'
import HelloWorld from '../HelloWorld.vue'

describe('HelloWorld', () => {
  test('正确渲染合同管理系统标题', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: ''
      }
    })
    expect(wrapper.find('h1').text()).toBe('合同管理系统')
  })

  test('显示默认欢迎文案', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: ''
      }
    })
    expect(wrapper.find('[data-test="welcome-message"]').text()).toBe('欢迎使用合同管理系统')
  })
})