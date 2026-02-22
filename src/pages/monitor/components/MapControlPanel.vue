<template>
  <div class="map-control-panel">
    <div class="control-group">
      <el-tooltip content="放大" placement="left">
        <el-button class="control-button" circle @click="$emit('zoom-in')">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="缩小" placement="left">
        <el-button class="control-button" circle @click="$emit('zoom-out')">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="重置视角" placement="left">
        <el-button class="control-button" circle @click="$emit('reset-view')">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
    
    <div class="control-group">
      <el-tooltip content="定位到当前位置" placement="left">
        <el-button class="control-button" circle @click="handleLocateMe">
          <el-icon><Location /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="全屏显示" placement="left">
        <el-button class="control-button" circle @click="handleFullScreen">
          <el-icon><FullScreen /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
    
    <div class="layer-control">
      <el-dropdown trigger="click" @command="handleLayerToggle">
        <el-button class="control-button" circle>
          <el-icon><Grid /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="base">
              <el-checkbox v-model="layerState.base">底图</el-checkbox>
            </el-dropdown-item>
            <el-dropdown-item command="terrain">
              <el-checkbox v-model="layerState.terrain">地形</el-checkbox>
            </el-dropdown-item>
            <el-dropdown-item command="buildings">
              <el-checkbox v-model="layerState.buildings">建筑</el-checkbox>
            </el-dropdown-item>
            <el-dropdown-item command="devices">
              <el-checkbox v-model="layerState.devices">设备</el-checkbox>
            </el-dropdown-item>
            <el-dropdown-item command="tracks">
              <el-checkbox v-model="layerState.tracks">轨迹</el-checkbox>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ZoomIn,
  ZoomOut,
  Refresh,
  Location,
  FullScreen,
  Grid
} from '@element-plus/icons-vue'

const emit = defineEmits<{
  'zoom-in': []
  'zoom-out': []
  'reset-view': []
  'toggle-layer': [layer: string, visible: boolean]
}>()

const layerState = ref({
  base: true,
  terrain: true,
  buildings: true,
  devices: true,
  tracks: true
})

const handleLocateMe = () => {
  console.log('定位到当前位置')
}

const handleFullScreen = () => {
  const element = document.querySelector('.scene-container')
  if (element) {
    if (!document.fullscreenElement) {
      element.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }
}

const handleLayerToggle = (layer: string) => {
  layerState.value[layer as keyof typeof layerState.value] = 
    !layerState.value[layer as keyof typeof layerState.value]
  
  emit('toggle-layer', layer, layerState.value[layer as keyof typeof layerState.value])
}
</script>

<style scoped>
.map-control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  border-radius: 20px;
  padding: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.control-button {
  width: 36px;
  height: 36px;
  font-size: 16px;
}

.layer-control {
  background: white;
  border-radius: 50%;
  padding: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>