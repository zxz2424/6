import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const pinia = createPinia()

pinia.use(createPersistedState({
  storage: localStorage,
  key: id => pinia-${id}
}))

export default pinia

export * from './modules/app'
export * from './modules/user'
export * from './modules/3d'
export * from './modules/business'
