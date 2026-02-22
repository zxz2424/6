import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import 'cesium/Build/Cesium/Widgets/widgets.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './common/router'

// 导入 WebSocket 客户端
import { webSocketClient } from '@/common/request/websocket'

// 导入样式
import './style.css'

const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 确保在注册 store 和 router 之前创建 pinia
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 注册自定义指令
import { setupDirectives } from './directives'
setupDirectives(app)

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 错误:', err)
  console.error('组件实例:', instance)
  console.error('错误信息:', info)
  
  // 可以在这里上报错误到服务器
}

// 开发阶段：临时设置用户权限和 token
if (import.meta.env.DEV) {
  import('@/common/store/modules/user/user').then(({ useUserStore }) => {
    const userStore = useUserStore()
    
    // 设置开发阶段的权限
    userStore.setToken('dev-token-' + Date.now())
    userStore.setPermissions([
      'system:user:query',
      'system:role:query', 
      'system:permission:query',
      'system:config:query',
      'system:python:editor',
      'system:task:create',
      'system:task:view',
      'system:task:manage'
    ])
    
    console.log('开发模式：已设置用户权限', userStore.permissions)
    
    // 用户登录后连接 WebSocket
    setTimeout(() => {
      if (userStore.token) {
        console.log('开发模式：连接 WebSocket')
        webSocketClient.connect()
      }
    }, 1000)
  })
}

// 全局变量，方便调试
if (import.meta.env.DEV) {
  // @ts-ignore
  window.$ws = webSocketClient
  console.log('WebSocket 客户端已挂载到 window.$ws')
}

app.mount('#app')

// 捕获未处理的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason)
  
  // 如果是网络错误，尝试重连 WebSocket
  if (event.reason?.message?.includes('Network') || 
      event.reason?.message?.includes('网络') ||
      event.reason?.code === 'NETWORK_ERROR') {
    
    console.log('检测到网络错误，尝试重连 WebSocket')
    if (webSocketClient.getStatus() !== 'connected') {
      webSocketClient.connect()
    }
  }
})

// 页面关闭前提示
window.addEventListener('beforeunload', (event) => {
  const tasks = webSocketClient.getStatus()
  if (tasks === 'connected') {
    // 如果有正在运行的任务，提示用户
    // 这里可以添加检查是否有正在运行的任务的逻辑
    // event.returnValue = '有任务正在运行，确定要离开吗？'
  }
})

// 导出 WebSocket 客户端供其他模块使用
export { webSocketClient }