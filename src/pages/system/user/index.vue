<template>
  <div class="user-management">
    <h1>用户管理</h1>
    
    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入用户名/昵称/邮箱"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>新增用户
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户表格 -->
    <el-card style="margin-top: 20px;">
      <el-table
        :data="userList"
        v-loading="loading"
        stripe
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 用户编辑对话框 -->
    <user-dialog
      v-model="dialogVisible"
      :type="dialogType"
      :data="dialogData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import UserDialog from './components/UserDialog.vue'

// 模拟数据
const userList = ref([
  {
    id: '1',
    username: 'admin',
    nickname: '超级管理员',
    email: 'admin@example.com',
    status: 'active',
    createTime: '2024-01-01 10:00:00'
  },
  {
    id: '2',
    username: 'user1',
    nickname: '普通用户',
    email: 'user1@example.com',
    status: 'active',
    createTime: '2024-01-02 14:00:00'
  }
])

const loading = ref(false)

const searchForm = reactive({
  keyword: '',
  status: ''
})

// 对话框状态
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const dialogData = ref<any>(null)

// 搜索
const handleSearch = () => {
  ElMessage.info('搜索功能开发中')
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
}

// 新增用户
const handleCreate = () => {
  dialogType.value = 'create'
  dialogData.value = null
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (user: any) => {
  dialogType.value = 'edit'
  dialogData.value = { ...user }
  dialogVisible.value = true
}

// 删除用户
const handleDelete = async (user: any) => {
  try {
    await ElMessageBox.confirm(`确定删除用户「${user.nickname}」吗？`, '提示', {
      type: 'warning'
    })
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

// 对话框操作成功
const handleDialogSuccess = () => {
  ElMessage.success('操作成功')
  // 这里可以重新加载数据
}

onMounted(() => {
  console.log('用户管理页面加载完成')
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}
</style>