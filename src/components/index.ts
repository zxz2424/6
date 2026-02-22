import type { App } from 'vue'

// Auto-register components
const components = import.meta.glob('./**/*.vue', { eager: true })

export function registerComponents(app: App) {
  for (const [path, module] of Object.entries(components)) {
    const name = path.split('/').pop()?.replace('.vue', '')
    if (name && module.default) {
      app.component(name, module.default)
    }
  }
}

// Export components
export { default as BasicLayout } from './basic/layout/index.vue'
export { default as BusinessLayout } from './business/layout/index.vue'
export { default as CesiumViewer } from './3d/viewer/index.vue'

export * from './basic'
export * from './business' 
export * from './3d'
export * from './form'
export * from './table'
export * from './chart'
