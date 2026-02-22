<template>
  <el-dialog
    v-model="dialogVisible"
    :title="type === 'create' ? '新增用户' : '编辑用户'"
    width="600px"
    @close="handleClose"
  >
    <p>用户编辑对话框开发中...</p>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 定义Props
const props = defineProps<{
  modelValue: boolean
  type: 'create' | 'edit'
  data?: any
}>()

// 定义Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

// 使用计算属性控制对话框显示
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 提交表单
const handleSubmit = () => {
  ElMessage.success(props.type === 'create' ? '创建成功' : '更新成功')
  emit('success')
  handleClose()
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData) {
    console.log('接收到用户数据:', newData)
  }
})
</script>