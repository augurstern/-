import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/styles/css-variables.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useAuthStore } from './stores/auth'
import dictionaryPlugin from './plugins/dictionary'

// 导入自定义插件
import plugins from './plugins'

// 导入全局样式
import './assets/styles/index.scss'

// 初始化Pinia状态管理
const pinia = createPinia()

// 创建Vue应用
const app = createApp(App)

// 安装插件
app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册字典插件
app.use(dictionaryPlugin)

// 安装自定义插件
app.use(plugins)

// 初始化认证状态
const initApp = async () => {
  const authStore = useAuthStore()
  
  try {
    await authStore.initAuth()
    console.log('认证状态初始化完成')
  } catch (error) {
    console.error('认证状态初始化失败:', error)
  } finally {
    // 挂载应用
    app.mount('#app')
  }
}

initApp()

// 导出app实例，供插件和组件使用
export { app }
