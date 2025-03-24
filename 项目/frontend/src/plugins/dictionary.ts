import { App } from 'vue'
import DictTag from '@/components/DictTag.vue'
import DictSelect from '@/components/DictSelect.vue'
import DictRadio from '@/components/DictRadio.vue'
import DictCheckbox from '@/components/DictCheckbox.vue'

// 字典插件
export default {
  install: (app: App) => {
    // 注册全局组件
    app.component('DictTag', DictTag)
    app.component('DictSelect', DictSelect)
    app.component('DictRadio', DictRadio)
    app.component('DictCheckbox', DictCheckbox)
    
    // 注册全局属性
    app.config.globalProperties.$dict = {
      // 获取字典标签
      label: (dictCode: string, value: string, defaultLabel = ''): string => {
        return defaultLabel
      },
      
      // 获取字典标签类型
      tagType: (dictCode: string, value: string): string => {
        return ''
      }
    }
  }
} 