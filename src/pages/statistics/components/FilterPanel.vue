<template>
  <el-card class="filter-panel">
    <el-form :model="filterParams" label-width="80px">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterParams.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-form-item label="设备类型">
            <el-select
              v-model="filterParams.deviceType"
              placeholder="请选择设备类型"
              clearable
              style="width: 100%"
            >
              <el-option label="全部" value="" />
              <el-option label="传感器" value="sensor" />
              <el-option label="摄像头" value="camera" />
              <el-option label="控制器" value="controller" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-form-item label="区域">
            <el-select
              v-model="filterParams.areaId"
              placeholder="请选择区域"
              clearable
              style="width: 100%"
            >
              <el-option label="全部区域" value="" />
              <el-option label="A区" value="area_a" />
              <el-option label="B区" value="area_b" />
              <el-option label="C区" value="area_c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-form-item label="统计粒度">
            <el-select
              v-model="filterParams.granularity"
              placeholder="请选择统计粒度"
              style="width: 100%"
            >
              <el-option label="按小时" value="hour" />
              <el-option label="按天" value="day" />
              <el-option label="按周" value="week" />
              <el-option label="按月" value="month" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" style="text-align: right;">
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, defineEmits, defineProps } from 'vue'

const emit = defineEmits(['filter-change', 'reset'])

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      timeRange: [],
      deviceType: '',
      areaId: '',
      granularity: 'day'
    })
  }
})

const filterParams = ref({
  timeRange: [
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substr(0, 19),
    new Date().toISOString().replace('T', ' ').substr(0, 19)
  ],
  deviceType: '',
  areaId: '',
  granularity: 'day'
})

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    filterParams.value = { ...newVal }
  }
}, { immediate: true })

// 筛选条件变化
watch(filterParams.value, () => {
  emit('filter-change', filterParams.value)
}, { deep: true })

const handleFilter = () => {
  emit('filter-change', filterParams.value)
}

const handleReset = () => {
  filterParams.value = {
    timeRange: [
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substr(0, 19),
      new Date().toISOString().replace('T', ' ').substr(0, 19)
    ],
    deviceType: '',
    areaId: '',
    granularity: 'day'
  }
  emit('reset')
}
</script>

<style scoped lang="scss">
.filter-panel {
  margin-bottom: 20px;
  
  :deep(.el-card__body) {
    padding: 20px;
  }
}
</style>