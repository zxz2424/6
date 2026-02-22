import type { App } from 'vue'
import { createPinia } from 'pinia'
import router from '@/common/router'

export const configureVue = (app: App) => {
  // 閰嶇疆Pinia鐘舵€佺鐞?
  const pinia = createPinia()
  app.use(pinia)
  
  // 閰嶇疆璺敱
  app.use(router)
  
  // 閰嶇疆鍏ㄥ眬缁勪欢
  import('@/components').then(({ registerComponents }) => {
    registerComponents(app)
  })
  
  // 閰嶇疆鍏ㄥ眬鎸囦护
  import('@/directives').then(({ registerDirectives }) => {
    registerDirectives(app)
  })
  
  return { pinia, router }
}
