import type { Directive } from 'vue'
import { useUserStore } from '@/common/store/modules/user/user'

const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    
    if (value && Array.isArray(value) && value.length > 0) {
      const hasPermission = userStore.permissions?.some(permission => 
        value.includes(permission)
      )
      
      if (!hasPermission) {
        el.parentNode?.removeChild(el)
      }
    }
  }
}

export default permission