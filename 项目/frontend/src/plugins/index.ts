import { App } from 'vue'
import permissionPlugin from './permission'
import validationPlugin from './validation'

/**
 * 安装所有插件
 * @param app Vue应用实例
 */
export function setupPlugins(app: App) {
  // 安装权限插件
  app.use(permissionPlugin)
  
  // 安装数据验证插件
  app.use(validationPlugin)
  
  console.log('所有插件已安装完成')
}

export default {
  install(app: App) {
    setupPlugins(app)
  }
} 