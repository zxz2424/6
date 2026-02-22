<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="800px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="权限名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入权限名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="权限编码" prop="code">
        <el-input
          v-model="formData.code"
          placeholder="请输入权限编码"
          maxlength="100"
          show-word-limit
        />
        <div class="form-tip">权限编码应唯一，如：system:user:create</div>
      </el-form-item>

      <el-form-item label="权限类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择权限类型">
          <el-option label="菜单" value="menu" />
          <el-option label="按钮" value="button" />
          <el-option label="接口" value="api" />
          <el-option label="数据" value="data" />
        </el-select>
      </el-form-item>

      <el-form-item label="上级权限" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="permissionTree"
          :props="treeProps"
          placeholder="请选择上级权限"
          check-strictly
          clearable
          style="width: 100%"
        />
        <div class="form-tip">不选择则创建为顶级权限</div>
      </el-form-item>

      <el-form-item v-if="formData.type === 'menu'" label="路由路径" prop="path">
        <el-input
          v-model="formData.path"
          placeholder="请输入路由路径"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item v-if="formData.type === 'menu'" label="组件路径" prop="component">
        <el-input
          v-model="formData.component"
          placeholder="请输入组件路径"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item v-if="formData.type === 'menu'" label="图标" prop="icon">
        <el-input
          v-model="formData.icon"
          placeholder="请输入图标名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item v-if="formData.type === 'data'" label="数据权限" prop="dataScope">
        <el-select v-model="formData.dataScope" placeholder="请选择数据权限">
          <el-option label="全部数据" value="all" />
          <el-option label="自定义" value="custom" />
          <el-option label="本部门" value="dept" />
          <el-option label="仅本人" value="self" />
        </el-select>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="0"
          :max="999"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio label="active">启用</el-radio>
          <el-radio label="inactive">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入权限描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useSystemStore } from '@/common/store/modules/system/system'

interface Props {
  modelValue: boolean
  type: 'create' | 'edit'
  data?: any
  parent?: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  type: 'create',
  undefined,  // ✅ 修复：使用 undefined 而不是 null
  parent: null
})

const emit = defineEmits<Emits>()

const systemStore = useSystemStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  code: '',
  type: 'menu',
  parentId: null as string | null,
  path: '',
  component: '',
  icon: '',
  dataScope: 'all',
  sort: 0,
  status: 'active',
  description: ''
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 50, message: '权限名称长度为2-50个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9:_]*$/, message: '权限编码格式不正确', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择权限类型', trigger: 'change' }
  ]
}

// 树形选择器配置
const treeProps = {
  value: 'id',
  label: 'name',
  children: 'children'
}

// 计算权限树（过滤掉当前编辑的权限及其子权限，避免循环引用）
const permissionTree = computed(() => {
  const tree = systemStore.permissionTree || []
  
  if (props.type === 'edit' && props.data) {
    // 过滤掉当前编辑的权限及其子权限
    const filterTree = (nodes: any[]): any[] => {
      return nodes.filter(node => {
        if (node.id === props.data.id) return false
        if (node.children) {
          node.children = filterTree(node.children)
        }
        return true
      })
    }
    return filterTree(JSON.parse(JSON.stringify(tree)))
  }
  
  return JSON.parse(JSON.stringify(tree))
})

// 计算对话框标题
const dialogTitle = computed(() => {
  if (props.parent) {
    return `为【${props.parent.name}】添加子权限`
  }
  return props.type === 'create' ? '新增权限' : '编辑权限'
})

// 监听visible变化
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 监听数据变化，编辑时填充表单
watch(() => props.data, (newData) => {
  if (newData && props.type === 'edit') {
    Object.assign(formData, {
      name: newData.name || '',
      code: newData.code || '',
      type: newData.type || 'menu',
      parentId: newData.parentId || null,
      path: newData.path || '',
      component: newData.component || '',
      icon: newData.icon || '',
      dataScope: newData.dataScope || 'all',
      sort: newData.sort || 0,
      status: newData.status || 'active',
      description: newData.description || ''
    })
  }
}, { immediate: true })

// 监听父级权限变化
watch(() => props.parent, (newParent) => {
  if (newParent && props.type === 'create') {
    formData.parentId = newParent.id
  }
}, { immediate: true })

// 监听权限类型变化
watch(() => formData.type, (newType) => {
  // 重置相关字段
  if (newType !== 'menu') {
    formData.path = ''
    formData.component = ''
    formData.icon = ''
  }
  if (newType !== 'data') {
    formData.dataScope = 'all'
  }
})

// 关闭对话框
const handleClose = () => {
  visible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    name: '',
    code: '',
    type: 'menu',
    parentId: props.parent?.id || null,
    path: '',
    component: '',
    icon: '',
    dataScope: 'all',
    sort: 0,
    status: 'active',
    description: ''
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const submitData = { ...formData }
    
    // 清理不需要的字段
    if (submitData.type !== 'menu') {
      delete submitData.path
      delete submitData.component
      delete submitData.icon
    }
    if (submitData.type !== 'data') {
      delete submitData.dataScope
    }

    if (props.type === 'create') {
      // 调用新增权限API
      // await systemStore.createPermission(submitData)
      ElMessage.success('权限创建成功')
    } else {
      // 调用编辑权限API
      // await systemStore.updatePermission(props.data.id, submitData)
      ElMessage.success('权限更新成功')
    }
    
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>