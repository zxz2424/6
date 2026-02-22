<template>
  <div class="config-management">
    <el-card>
      <template #header>
        <span>系统配置</span>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 3D场景配置 -->
        <el-tab-pane label="3D场景配置" name="scene">
          <el-form :model="sceneConfig" label-width="120px">
            <el-form-item label="底图类型">
              <el-select v-model="sceneConfig.baseMap">
                <el-option label="高德地图" value="amap" />
                <el-option label="天地图" value="tianditu" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="地形显示">
              <el-switch v-model="sceneConfig.terrain" />
            </el-form-item>

            <el-form-item label="默认视角">
              <div class="view-config">
                <el-input-number v-model="sceneConfig.defaultView.longitude" label="经度" />
                <el-input-number v-model="sceneConfig.defaultView.latitude" label="纬度" />
                <el-input-number v-model="sceneConfig.defaultView.height" label="高度" />
                <el-input-number v-model="sceneConfig.defaultView.heading" label="方位角" />
                <el-input-number v-model="sceneConfig.defaultView.pitch" label="俯仰角" />
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 刷新配置 -->
        <el-tab-pane label="刷新配置" name="refresh">
          <el-form :model="refreshConfig" label-width="120px">
            <el-form-item label="刷新频率">
              <el-input-number
                v-model="refreshConfig.frequency"
                :min="1"
                :max="60"
                controls-position="right"
              />
              <span class="unit">秒</span>
            </el-form-item>
            
            <el-form-item label="实时刷新">
              <el-switch v-model="refreshConfig.realtime" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 主题配置 -->
        <el-tab-pane label="主题配置" name="theme">
          <el-form :model="themeConfig" label-width="120px">
            <el-form-item label="主题模式">
              <el-radio-group v-model="themeConfig.mode">
                <el-radio label="light">浅色</el-radio>
                <el-radio label="dark">深色</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="主题色">
              <el-color-picker v-model="themeConfig.primaryColor" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 安全配置 -->
        <el-tab-pane label="安全配置" name="security">
          <el-form :model="securityConfig" label-width="160px">
            <el-form-item label="密码最小长度">
              <el-input-number
                v-model="securityConfig.passwordMinLength"
                :min="6"
                :max="20"
              />
            </el-form-item>
            
            <el-form-item label="密码需包含特殊字符">
              <el-switch v-model="securityConfig.passwordRequireSpecial" />
            </el-form-item>
            
            <el-form-item label="会话超时时间">
              <el-input-number
                v-model="securityConfig.sessionTimeout"
                :min="300"
                :max="86400"
              />
              <span class="unit">秒</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="action-buttons">
        <el-button type="primary" @click="handleSave" :loading="loading">
          保存配置
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useSystemStore } from '@/common/store/modules/system/system';
import { ElMessage } from 'element-plus';
import type { SystemConfig } from '@/types/system';

const systemStore = useSystemStore();
const activeTab = ref('scene');
const loading = ref(false);

// 配置数据
const sceneConfig = reactive({
  baseMap: 'amap',
  terrain: true,
  defaultView: {
    longitude: 116.3974,
    latitude: 39.9093,
    height: 1000,
    heading: 0,
    pitch: -45
  }
});

const refreshConfig = reactive({
  frequency: 5,
  realtime: true
});

const themeConfig = reactive({
  mode: 'light',
  primaryColor: '#409EFF'
});

const securityConfig = reactive({
  passwordMinLength: 8,
  passwordRequireSpecial: true,
  sessionTimeout: 7200
});

// 加载配置
const loadConfig = async () => {
  const res = await systemStore.fetchSystemConfig();
  if (res.code === 200 && res.data) {
    const config = res.data;
    Object.assign(sceneConfig, config.scene);
    Object.assign(refreshConfig, config.refresh);
    Object.assign(themeConfig, config.theme);
    Object.assign(securityConfig, config.security);
  }
};

// 保存配置
const handleSave = async () => {
  loading.value = true;
  try {
    const config: Partial<SystemConfig> = {
      scene: { ...sceneConfig },
      refresh: { ...refreshConfig },
      theme: { ...themeConfig },
      security: { ...securityConfig }
    };
    
    await systemStore.updateSystemConfig(config);
    ElMessage.success('配置保存成功');
  } catch (error) {
    ElMessage.error('配置保存失败');
  } finally {
    loading.value = false;
  }
};

// 重置配置
const handleReset = () => {
  loadConfig();
  ElMessage.info('配置已重置');
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.config-management {
  padding: 20px;
}

.view-config {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.unit {
  margin-left: 10px;
  color: #666;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}
</style>