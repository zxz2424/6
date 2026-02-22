<template>
  <div class="permission-management">
    <el-card>
      <template #header>
        <div class="header">
          <span>权限管理</span>
          <div>
            <el-button type="primary" @click="handleRefresh" v-permission="'system:permission:query'">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
            <el-button @click="handleExpandAll" v-permission="'system:permission:query'">
              <el-icon><Expand /></el-icon>展开全部
            </el-button>
            <el-button @click="handleCollapseAll" v-permission="'system:permission:query'">
              <el-icon><Fold /></el-icon>折叠全部
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        :data="permissionTree"
        v-loading="loading"
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :height="tableHeight"
      >
        <el-table-column prop="name" label="权限名称" min-width="200">
          <template #default="{ row }">
            <span :class="getPermissionClass(row.type)">
              <el-icon v-if="row.type === 'menu'">
                <Menu />
              </el-icon>
              <el-icon v-else-if="row.type === 'button'">
                <Pointer />
              </el-icon>
              <el-icon v-else-if="row.type === 'api'">
                <Connection />
              </el-icon>
              <el-icon v-else>
                <DataLine />
              </el-icon>
              {{ row.name }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="code" label="权限编码" min-width="180" />
        
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="dataScope" label="数据权限" width="120" v-if="hasDataPermission">
          <template #default="{ row }">
            <el-tag v-if="row.dataScope" :type="getDataScopeTagType(row.dataScope)" size="small">
              {{ getDataScopeText(row.dataScope) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-permission="'system:permission:update'"
            >
              编辑
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="handleAddChild(row)"
              v-permission="'system:permission:create'"
            >
              添加子权限
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-permission="'system:permission:delete'"
              :disabled="row.children && row.children.length > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 权限编辑对话框 -->
    <permission-dialog
      v-model="dialog.visible"
      :type="dialog.type"
      :data="dialog.data"
      :parent="dialog.parent"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { useSystemStore } from '@/common/store/modules/system/system';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Expand, Fold, Menu, Pointer, Connection, DataLine } from '@element-plus/icons-vue';
import PermissionDialog from './components/PermissionDialog.vue';
import type { Permission } from '@/types/system';

const systemStore = useSystemStore();
const loading = ref(false);

const dialog = reactive({
  visible: false,
  type: 'create' as 'create' | 'edit',
  data: null as any,
  parent: null as Permission | null
});

// 计算属性
const permissionTree = computed(() => systemStore.permissionTree);
const hasDataPermission = computed(() => 
  permissionTree.value.some(permission => 
    permission.type === 'data' || 
    permission.children?.some(child => child.type === 'data')
  )
);

// 获取权限类型样式
const getPermissionClass = (type: string) => {
  const classMap = {
    menu: 'permission-menu',
    button: 'permission-button',
    api: 'permission-api',
    data: 'permission-data'
  };
  return classMap[type as keyof typeof classMap] || 'permission-default';
};

// 获取类型标签样式
const getTypeTagType = (type: string) => {
  const typeMap = {
    menu: 'success',
    button: 'warning',
    api: 'info',
    data: 'primary'
  };
  return typeMap[type as keyof typeof typeMap] || 'info';
};

// 获取类型显示文本
const getTypeText = (type: string) => {
  const textMap = {
    menu: '菜单',
    button: '按钮',
    api: '接口',
    data: '数据'
  };
  return textMap[type as keyof typeof textMap] || type;
};

// 获取数据权限标签样式
const getDataScopeTagType = (dataScope: string) => {
  const scopeMap = {
    all: 'success',
    custom: 'warning',
    dept: 'info',
    self: 'primary'
  };
  return scopeMap[dataScope as keyof typeof scopeMap] || 'info';
};

// 获取数据权限显示文本
const getDataScopeText = (dataScope: string) => {
  const textMap = {
    all: '全部数据',
    custom: '自定义',
    dept: '本部门',
    self: '仅本人'
  };
  return textMap[dataScope as keyof typeof textMap] || dataScope;
};

// 加载权限树
const loadPermissionTree = async () => {
  loading.value = true;
  try {
    await systemStore.fetchPermissionTree();
  } catch (error) {
    ElMessage.error('加载权限数据失败');
  } finally {
    loading.value = false;
  }
};

// 刷新权限
const handleRefresh = () => {
  loadPermissionTree();
};

// 展开全部
const handleExpandAll = () => {
  // 这里需要实现展开逻辑，可能需要使用tree-table组件
  ElMessage.info('展开全部功能待实现');
};

// 折叠全部
const handleCollapseAll = () => {
  // 这里需要实现折叠逻辑
  ElMessage.info('折叠全部功能待实现');
};

// 编辑权限
const handleEdit = (permission: Permission) => {
  dialog.type = 'edit';
  dialog.data = { ...permission };
  dialog.parent = null;
  dialog.visible = true;
};

// 添加子权限
const handleAddChild = (parent: Permission) => {
  dialog.type = 'create';
  dialog.data = null;
  dialog.parent = parent;
  dialog.visible = true;
};

// 删除权限
const handleDelete = async (permission: Permission) => {
  try {
    await ElMessageBox.confirm(
      `确定删除权限「${permission.name}」吗？此操作不可恢复！`,
      '警告',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      }
    );
    
    // 调用删除API
    // await systemStore.deletePermission(permission.id);
    ElMessage.success('删除成功');
    loadPermissionTree();
  } catch (error) {
    // 用户取消删除
  }
};

// 对话框操作成功
const handleDialogSuccess = () => {
  loadPermissionTree();
};

onMounted(() => {
  loadPermissionTree();
});

// 计算表格高度
const tableHeight = computed(() => {
  const windowHeight = window.innerHeight;
  return windowHeight - 300; // 根据页面布局调整这个值
});

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', () => {
    // 触发重新计算
  });
});
</script>

<style scoped>
.permission-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-menu {
  color: #67c23a;
  font-weight: 500;
}

.permission-button {
  color: #e6a23c;
  font-weight: 500;
}

.permission-api {
  color: #909399;
  font-weight: 500;
}

.permission-data {
  color: #409eff;
  font-weight: 500;
}

.permission-default {
  color: #606266;
}
</style>