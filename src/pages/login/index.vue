<template>
  <div class="login-page">
    <el-card class="login-card">
      <template #header>
        <h2>三维可视化平台</h2>
        <div class="login-mode">
          <el-tag v-if="isDevMode" type="success">开发模式</el-tag>
          <p>请登录您的账户</p>
        </div>
      </template>
      
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            style="width: 100%" 
            @click="handleLogin"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
        
        <!-- 开发模式提示 -->
        <div v-if="isDevMode" class="dev-tips">
          <el-alert
            title="开发模式提示"
            type="info"
            :closable="false"
            show-icon
          >
            <p>当前为开发环境，您可以使用以下账号登录：</p>
            <p>用户名: <strong>admin</strong></p>
            <p>密码: <strong>admin888</strong></p>
            <p>或者直接点击登录按钮，系统会自动登录</p>
          </el-alert>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/common/store/modules/user/user'
import { ElMessage } from 'element-plus'
// 核心修改：替换为 axios 直接请求，避免依赖错误的 api 封装
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref()
const loading = ref(false)

const isDevMode = computed(() => import.meta.env.DEV)

const loginForm = ref({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 登录方法（核心修改：改为 GET 请求，适配后端接口）
const handleLogin = async () => {
  loginFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      // 1. 构造后端需要的参数（和 Swagger 接口参数一致）
      const loginParams = {
        username: loginForm.value.username,
        password: loginForm.value.password,
        appId: import.meta.env.VITE_APP_ID || 'system',
        systemCode: import.meta.env.VITE_SYSTEM_CODE || 'openauth'
      }
      
      // 2. 核心修复：改为 GET 请求（后端接口只支持 GET）
      const response = await axios.get('/api/Login/UserLogin', {
        params: loginParams // 通过 Query 参数传递，符合后端要求
      })
      
      // 3. 处理后端返回结果（适配 Yuebon 框架的返回格式）
      const resData = response.data
      if (resData.ErrCode === 0) {
        // 保存 token
        userStore.setToken(resData.ResData.AccessToken)
        
        // 适配后端返回的用户信息结构
        userStore.setUserInfo({
          id: resData.ResData.UserId || 1,
          username: resData.ResData.Account || 'admin',
          nickname: resData.ResData.RealName || '管理员',
          avatar: resData.ResData.HeadIcon || '',
          roles: resData.ResData.Role || ['admin']
        })
        // 保存用户权限
        userStore.setPermissions(resData.ResData.Permissions || [
          'system:user:query',
          'system:role:query', 
          'system:permission:query',
          'business:script:editor',
          '3d:scene:view',
          'monitor:view',
          'alarm:view',
          'log:view',
          'statistics:view'
        ])
        
        ElMessage.success('登录成功')
        router.push('/home')
      } else {
        ElMessage.error(resData.ErrMsg || '登录失败')
      }
    } catch (error: any) {
      console.error('登录请求失败：', error)
      // 更友好的错误提示
      const errorMsg = error.response?.data?.ErrMsg 
        || error.message 
        || '登录失败，请检查账号密码或接口配置'
      ElMessage.error(errorMsg)
    } finally {
      loading.value = false
    }
  })
}

// 开发环境：自动登录
const autoLogin = () => {
  if (!isDevMode.value) return
  
  loading.value = true
  
  // 开发环境：模拟登录成功
  setTimeout(() => {
    userStore.setToken('dev-token-' + Date.now())
    userStore.setUserInfo({
      id: 1,
      username: 'admin',
      nickname: '管理员',
      avatar: '',
      roles: ['admin']
    })
    userStore.setPermissions([
      'system:user:query',
      'system:role:query', 
      'system:permission:query',
      'business:script:editor',
      '3d:scene:view',
      'monitor:view',
      'alarm:view',
      'log:view',
      'statistics:view'
    ])
    
    ElMessage.success('开发环境：已自动登录为管理员')
    router.push('/home')
    loading.value = false
  }, 500)
}

// 页面加载时，如果是开发环境，自动填充用户名和正确密码
onMounted(() => {
  if (isDevMode.value) {
    loginForm.value.username = 'admin'
    loginForm.value.password = 'admin888' // 后端真实密码
    // autoLogin()          自动登录，开发者模式
  }
})
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  text-align: center;
}

.login-card h2 {
  margin: 0;
  color: #303133;
}

.login-mode {
  margin: 10px 0 0 0;
}

.login-mode p {
  margin: 10px 0 0 0;
  color: #909399;
}

.dev-tips {
  margin-top: 20px;
  text-align: left;
}

.dev-tips p {
  margin: 5px 0;
  font-size: 12px;
  color: #606266;
}
</style>