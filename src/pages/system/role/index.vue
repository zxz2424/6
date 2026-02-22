<template>
  <div class="role-management">
    <el-card>
      <template #header>
        <div class="header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleCreate" v-permission="'system:role:create'">
            <el-icon><Plus /></el-icon>新增角色
          </el-button>
        </div>
      </template>

      <el-table
        :data="systemStore.roles"
        v-loading="systemStore.roleLoading"
        stripe
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="角色名称" min-width="120" />
        <el-table-column prop="code" label="角色编码" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-permission="'system:role:update'"
            >
              编辑
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="handlePermission(row)"
              v-permission="'system:role:permission'"
            >
              权限
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-permission="'system:role:delete'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 角色编辑对话框 -->
    <role-dialog
      v-model="dialog.visible"
      :type="dialog.type"
      :data="dialog.data"
      @success="handleDialogSuccess"
    />

    <!-- 权限分配对话框 -->
    <permission-dialog
      v-model="permissionDialog.visible"
      :role="permissionDialog.role"
      @success="handlePermissionSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useSystemStore } from '@/common/store/modules/system/system';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import RoleDialog from './components/RoleDialog.vue';
import PermissionDialog from './components/PermissionDialog.vue';

const systemStore = useSystemStore();

const dialog = reactive({
  visible: false,
  type: 'create' as 'create' | 'edit',
  data: null as any
});

const permissionDialog = reactive({
  visible: false,
  role: null as any
});

// 加载角色列表
const loadRoles = async () => {
  await systemStore.fetchRoles();
};

// 新增角色
const handleCreate = () => {
  dialog.type = 'create';
  dialog.data = null;
  dialog.visible = true;
};

// 编辑角色
const handleEdit = (role: any) => {
  dialog.type = 'edit';
  dialog.data = { ...role };
  dialog.visible = true;
};

// 分配权限
const handlePermission = (role: any) => {
  permissionDialog.role = role;
  permissionDialog.visible = true;
};

// 删除角色
const handleDelete = async (role: any) => {
  try {
    await ElMessageBox.confirm(`确定删除角色「${role.name}」吗？`, '提示', {
      type: 'warning'
    });
    
    // await systemStore.deleteRole(role.id);
    ElMessage.success('删除成功');
    loadRoles();
  } catch (error) {
    // 用户取消删除
  }
};

// 对话框操作成功
const handleDialogSuccess = () => {
  loadRoles();
};

// 权限分配成功
const handlePermissionSuccess = () => {
  ElMessage.success('权限分配成功');
  loadRoles();
};

onMounted(() => {
  loadRoles();
});
</script>

<style scoped>
.role-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>