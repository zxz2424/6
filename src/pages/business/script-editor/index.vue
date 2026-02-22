<template>
  <div class="python-editor">
    <el-card shadow="never" class="editor-card">
      <template #header>
        <div class="editor-header">
          <div class="header-left">
            <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
              <el-icon><Document /></el-icon>
              Python脚本编辑器
            </h3>
            <!-- 任务状态标签 -->
            <el-tag v-if="currentTask?.status" :type="getTaskTagType(currentTask.status)" size="small">
              {{ getTaskStatusText(currentTask.status) }}
            </el-tag>
            <el-tag v-if="isDirty" type="warning" size="small">未保存</el-tag>
          </div>
          <div class="header-right">
            <el-button-group>
              <el-button type="primary" @click="handleSave" :loading="saving" size="small">
                <el-icon><DocumentAdd /></el-icon>保存
              </el-button>
              <el-button 
                type="success" 
                @click="handleSubmitTask" 
                :loading="submittingTask" 
                :disabled="!!currentTask?.status && ['pending', 'running'].includes(currentTask.status)"
                size="small"
              >
                <el-icon><VideoPlay /></el-icon>{{ getRunButtonText }}
              </el-button>
              <!-- 取消任务按钮 -->
              <el-button 
                v-if="currentTask?.status === 'running' || currentTask?.status === 'pending'"
                type="warning" 
                @click="handleCancelTask" 
                :loading="cancelingTask"
                size="small"
              >
                <el-icon><Close /></el-icon>取消任务
              </el-button>
              <el-button @click="handleFormat" size="small">
                <el-icon><MagicStick /></el-icon>格式化
              </el-button>
              <el-button @click="handleClear" size="small">
                <el-icon><Delete /></el-icon>清空
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 任务信息栏 -->
      <div class="task-info-bar" v-if="currentTask">
        <div class="task-info-content">
          <div class="task-info-left">
            <span class="task-id">任务ID: {{ currentTask.id }}</span>
            <span class="task-name" v-if="currentTask.name">{{ currentTask.name }}</span>
            <span class="task-progress" v-if="currentTask.progress > 0">
              进度: {{ currentTask.progress }}%
            </span>
          </div>
          <div class="task-info-right">
            <span class="task-time">创建时间: {{ formatTime(currentTask.createdAt) }}</span>
            <span class="task-duration" v-if="currentTask.duration">
              运行时间: {{ currentTask.duration }}s
            </span>
          </div>
        </div>
        <!-- 进度条 -->
        <el-progress 
          v-if="currentTask.progress > 0 && currentTask.status === 'running'"
          :percentage="currentTask.progress" 
          :status="getProgressStatus(currentTask.status)"
          :stroke-width="3"
          style="margin-top: 4px;"
        />
      </div>

      <div class="editor-main">
        <!-- 左侧编辑器区域 -->
        <div class="editor-left">
          <div class="editor-tools">
            <el-space>
              <el-button size="small" @click="insertTemplate('function')">
                <el-icon><Plus /></el-icon>函数模板
              </el-button>
              <el-button size="small" @click="insertTemplate('class')">
                <el-icon><Plus /></el-icon>类模板
              </el-button>
              <el-button size="small" @click="insertTemplate('import')">
                <el-icon><Upload /></el-icon>导入模板
              </el-button>
              <el-select 
                v-model="selectedTheme" 
                size="small" 
                placeholder="主题"
                style="width: 100px;"
              >
                <el-option label="浅色" value="vs" />
                <el-option label="深色" value="vs-dark" />
                <el-option label="HC黑" value="hc-black" />
              </el-select>
            </el-space>
          </div>
          
          <div class="editor-container">
            <PythonMonacoEditor
              v-model="code"
              language="python"
              height="100%"
              theme="vs-dark"
              ref="editorRef"
            />
          </div>
        </div>

        <!-- 右侧边栏 -->
        <div class="editor-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
          <!-- 边栏折叠按钮 -->
          <div class="sidebar-toggle" @click="toggleSidebar">
            <el-icon :size="16">
              <component :is="isSidebarCollapsed ? 'ArrowLeft' : 'ArrowRight'" />
            </el-icon>
          </div>

          <div class="sidebar-content" v-show="!isSidebarCollapsed">
            <el-tabs v-model="activeTab" stretch class="sidebar-tabs">
              <el-tab-pane label="输出" name="output">
                <div class="output-content">
                  <!-- 输出过滤工具栏 -->
                  <div class="filter-toolbar">
                    <div class="filter-header">
                      <span class="filter-title">输出过滤</span>
                      <el-tag size="small" type="info">
                        显示: {{ filteredOutputCount }}/{{ totalOutputCount }}
                      </el-tag>
                    </div>
                    <div class="filter-controls">
                      <el-space size="small" wrap>
                        <!-- 日志级别过滤 -->
                        <el-select 
                          v-model="outputFilter.level" 
                          placeholder="级别" 
                          size="small"
                          clearable
                          style="width: 100px"
                        >
                          <el-option label="全部" value="" />
                          <el-option label="INFO" value="INFO" />
                          <el-option label="WARN" value="WARN" />
                          <el-option label="ERROR" value="ERROR" />
                          <el-option label="DEBUG" value="DEBUG" />
                        </el-select>
                        
                        <!-- 时间窗口过滤 -->
                        <el-select 
                          v-model="outputFilter.timeWindow" 
                          placeholder="时间窗口" 
                          size="small"
                          style="width: 110px"
                        >
                          <el-option label="全部时间" value="all" />
                          <el-option label="最近1小时" value="1h" />
                          <el-option label="最近30分钟" value="30m" />
                          <el-option label="最近15分钟" value="15m" />
                          <el-option label="最近5分钟" value="5m" />
                          <el-option label="最近1分钟" value="1m" />
                        </el-select>
                        
                        <!-- 显示条数限制 -->
                        <el-select 
                          v-model="outputFilter.limit" 
                          placeholder="显示条数" 
                          size="small"
                          style="width: 110px"
                        >
                          <el-option label="全部" value="all" />
                          <el-option label="100条" :value="100" />
                          <el-option label="500条" :value="500" />
                          <el-option label="1000条" :value="1000" />
                          <el-option label="2000条" :value="2000" />
                          <el-option label="5000条" :value="5000" />
                        </el-select>
                        
                        <!-- 关键词过滤 -->
                        <el-input
                          v-model="outputFilter.keyword"
                          placeholder="搜索输出内容..."
                          size="small"
                          clearable
                          style="width: 150px"
                        >
                          <template #prefix>
                            <el-icon><Search /></el-icon>
                          </template>
                        </el-input>
                        
                        <!-- 过滤操作按钮 -->
                        <el-button-group size="small">
                          <el-button 
                            @click="applyOutputFilter"
                            type="primary"
                          >
                            <el-icon><Filter /></el-icon>应用
                          </el-button>
                          <el-button 
                            @click="clearOutputFilter"
                          >
                            <el-icon><Refresh /></el-icon>重置
                          </el-button>
                        </el-button-group>
                      </el-space>
                    </div>
                  </div>
                  
                  <!-- 过滤后的输出内容 -->
                  <div class="output-text-container" ref="outputContainer">
                    <div 
                      v-for="(line, index) in filteredOutputLines" 
                      :key="index"
                      class="output-line"
                      :class="getLineClass(line)"
                    >
                      {{ line }}
                    </div>
                    <div v-if="filteredOutputLines.length === 0" class="empty-placeholder">
                      <el-empty description="无输出内容或所有内容已被过滤" :image-size="80" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="错误" name="error">
                <div class="error-content">
                  <!-- 错误过滤工具栏 -->
                  <div class="filter-toolbar">
                    <div class="filter-header">
                      <span class="filter-title">错误过滤</span>
                      <el-tag size="small" type="info">
                        显示: {{ filteredErrorCount }}/{{ totalErrorCount }}
                      </el-tag>
                    </div>
                    <div class="filter-controls">
                      <el-space size="small" wrap>
                        <!-- 时间窗口过滤 -->
                        <el-select 
                          v-model="errorFilter.timeWindow" 
                          placeholder="时间窗口" 
                          size="small"
                          style="width: 110px"
                        >
                          <el-option label="全部时间" value="all" />
                          <el-option label="最近1小时" value="1h" />
                          <el-option label="最近30分钟" value="30m" />
                          <el-option label="最近15分钟" value="15m" />
                          <el-option label="最近5分钟" value="5m" />
                          <el-option label="最近1分钟" value="1m" />
                        </el-select>
                        
                        <!-- 显示条数限制 -->
                        <el-select 
                          v-model="errorFilter.limit" 
                          placeholder="显示条数" 
                          size="small"
                          style="width: 110px"
                        >
                          <el-option label="全部" value="all" />
                          <el-option label="50条" :value="50" />
                          <el-option label="100条" :value="100" />
                          <el-option label="200条" :value="200" />
                          <el-option label="500条" :value="500" />
                          <el-option label="1000条" :value="1000" />
                        </el-select>
                        
                        <!-- 关键词过滤 -->
                        <el-input
                          v-model="errorFilter.keyword"
                          placeholder="搜索错误内容..."
                          size="small"
                          clearable
                          style="width: 150px"
                        >
                          <template #prefix>
                            <el-icon><Search /></el-icon>
                          </template>
                        </el-input>
                        
                        <!-- 过滤操作按钮 -->
                        <el-button-group size="small">
                          <el-button 
                            @click="applyErrorFilter"
                            type="primary"
                          >
                            <el-icon><Filter /></el-icon>应用
                          </el-button>
                          <el-button 
                            @click="clearErrorFilter"
                          >
                            <el-icon><Refresh /></el-icon>重置
                          </el-button>
                        </el-button-group>
                      </el-space>
                    </div>
                  </div>
                  
                  <!-- 过滤后的错误内容 -->
                  <div class="error-text-container" ref="errorContainer">
                    <div 
                      v-for="(line, index) in filteredErrorLines" 
                      :key="index"
                      class="error-line"
                    >
                      {{ line }}
                    </div>
                    <div v-if="filteredErrorLines.length === 0" class="empty-placeholder">
                      <el-empty description="无错误信息或错误信息已被过滤" :image-size="80" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="脚本" name="scripts">
                <div class="scripts-panel">
                  <div class="scripts-header">
                    <h4>脚本管理</h4>
                    <el-button type="primary" size="small" @click="showSaveDialog">
                      <el-icon><FolderAdd /></el-icon>新建
                    </el-button>
                  </div>
                  
                  <div class="scripts-list">
                    <el-scrollbar height="calc(100vh - 300px)">
                      <el-empty 
                        v-if="scriptList.length === 0" 
                        description="暂无保存的脚本" 
                        :image-size="80"
                      />
                      <div v-else>
                        <div 
                          v-for="script in scriptList" 
                          :key="script.id"
                          class="script-item"
                          :class="{ 'active': activeScriptId === script.id }"
                          @click="selectScript(script)"
                        >
                          <div class="script-item-header">
                            <el-icon class="script-icon"><Document /></el-icon>
                            <span class="script-name">{{ script.name }}</span>
                            <div class="script-actions">
                              <el-tooltip content="加载">
                                <el-button 
                                  link 
                                  size="small" 
                                  @click.stop="loadScript(script)"
                                >
                                  <el-icon><Download /></el-icon>
                                </el-button>
                              </el-tooltip>
                              <el-tooltip content="删除">
                                <el-button 
                                  link 
                                  size="small" 
                                  @click.stop="deleteScript(script)"
                                >
                                  <el-icon><Delete /></el-icon>
                                </el-button>
                              </el-tooltip>
                            </div>
                          </div>
                          <div class="script-description">
                            {{ script.description || '无描述' }}
                          </div>
                          <div class="script-meta">
                            <span class="script-time">{{ script.createdAt }}</span>
                            <el-tag size="small" effect="plain">{{ script.language || 'python' }}</el-tag>
                          </div>
                        </div>
                      </div>
                    </el-scrollbar>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 保存脚本对话框 -->
    <el-dialog v-model="saveDialogVisible" title="保存脚本" width="400px">
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="脚本名称">
          <el-input v-model="saveForm.name" placeholder="请输入脚本名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="saveForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入脚本描述"
          />
        </el-form-item>
        <el-form-item label="语言">
          <el-select v-model="saveForm.language" placeholder="选择语言">
            <el-option label="Python" value="python" />
            <el-option label="JavaScript" value="javascript" />
            <el-option label="TypeScript" value="typescript" />
            <el-option label="JSON" value="json" />
            <el-option label="HTML" value="html" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Document, 
  DocumentAdd, 
  VideoPlay, 
  Delete, 
  MagicStick,
  Plus,
  Upload,
  FolderAdd,
  Download,
  ArrowLeft,
  ArrowRight,
  Close,
  Search,
  Filter,
  Refresh
} from '@element-plus/icons-vue';
import PythonMonacoEditor from '@/components/business/python-editor/PythonMonacoEditor.vue';
import { webSocketClient } from '@/common/request/websocket';
import { useTaskStore } from '@/common/store/modules/task';
import type { Task, TaskStatus } from '@/types/task';

// 编辑器引用
const editorRef = ref<InstanceType<typeof PythonMonacoEditor>>();

// 数据状态
const code = ref(`# Python脚本编辑器
# 这是一个Python脚本编辑环境，你可以在这里编写和运行Python代码

def greet(name: str) -> str:
    """一个简单的问候函数"""
    return f"Hello, {name}! Welcome to 3D Visualization Platform."

def calculate_sum(a: float, b: float) -> float:
    """计算两个数的和"""
    return a + b

class DataProcessor:
    """数据处理类示例"""
    
    def __init__(self, data: list):
        self.data = data
    
    def process(self):
        """处理数据"""
        if not self.data:
            return []
        return [item * 2 for item in self.data]

# 主程序入口
if __name__ == "__main__":
    # 示例代码执行
    print("=== Python脚本执行开始 ===")
    
    # 调用函数
    greeting = greet("开发者")
    print(greeting)
    
    # 计算示例
    result = calculate_sum(10, 20)
    print(f"10 + 20 = {result}")
    
    # 使用类
    processor = DataProcessor([1, 2, 3, 4, 5])
    processed_data = processor.process()
    print(f"处理后的数据: {processed_data}")
    
    print("=== Python脚本执行结束 ===")
`);

const activeTab = ref('output');
const isDirty = ref(false);
const saving = ref(false);
const submittingTask = ref(false);
const cancelingTask = ref(false);
const selectedTheme = ref('vs-dark');
const scriptList = ref<any[]>([]);
const saveDialogVisible = ref(false);
const isSidebarCollapsed = ref(false);
const activeScriptId = ref<string | null>(null);
const saveForm = ref({
  name: '',
  description: '',
  language: 'python'
});

// 输出过滤相关状态
interface OutputFilter {
  level: string; // 日志级别
  timeWindow: string; // 时间窗口: 'all' | '1h' | '30m' | '15m' | '5m' | '1m'
  limit: number | 'all'; // 显示条数限制
  keyword: string; // 关键词搜索
}

interface ErrorFilter {
  timeWindow: string; // 时间窗口
  limit: number | 'all'; // 显示条数限制
  keyword: string; // 关键词搜索
}

const outputFilter = ref<OutputFilter>({
  level: '',
  timeWindow: '1h', // 默认显示最近1小时
  limit: 1000, // 默认显示1000条
  keyword: ''
});

const errorFilter = ref<ErrorFilter>({
  timeWindow: '1h', // 默认显示最近1小时
  limit: 200, // 默认显示200条
  keyword: ''
});

// 输出和错误数据结构
interface LogEntry {
  id: string; // 唯一ID
  raw: string; // 原始内容
  timestamp: number; // 时间戳（毫秒）
  level?: string; // 日志级别
  taskId?: string; // 关联的任务ID
}

interface ErrorEntry {
  id: string; // 唯一ID
  raw: string; // 原始内容
  timestamp: number; // 时间戳（毫秒）
  taskId?: string; // 关联的任务ID
}

// 原始数据存储
const rawOutputLogs = ref<LogEntry[]>([]);
const rawErrorLogs = ref<ErrorEntry[]>([]);

// 过滤后的数据
const filteredOutputLogs = ref<LogEntry[]>([]);
const filteredErrorLogs = ref<ErrorEntry[]>([]);

// 任务相关状态
const currentTask = ref<Task | null>(null);
const taskUnsubscribe = ref<(() => void) | null>(null);

// 导入 Store
const taskStore = useTaskStore();

// 计算属性
const getRunButtonText = computed(() => {
  if (!currentTask.value) return '提交任务';
  
  switch (currentTask.value.status) {
    case 'pending': return '等待中...';
    case 'running': return '运行中...';
    case 'completed': return '再次运行';
    case 'failed': return '重试';
    case 'cancelled': return '重新运行';
    default: return '提交任务';
  }
});

// 统计信息
const totalOutputCount = computed(() => rawOutputLogs.value.length);
const filteredOutputCount = computed(() => filteredOutputLogs.value.length);
const totalErrorCount = computed(() => rawErrorLogs.value.length);
const filteredErrorCount = computed(() => filteredErrorLogs.value.length);

// 显示的数据
const filteredOutputLines = computed(() => filteredOutputLogs.value.map(log => log.raw));
const filteredErrorLines = computed(() => filteredErrorLogs.value.map(log => log.raw));

// 监视代码变化
watch(() => code.value, () => {
  isDirty.value = true;
}, { deep: true });

// 监视主题变化
watch(selectedTheme, (newTheme) => {
  console.log('主题切换到:', newTheme);
});

// 组件挂载时
onMounted(() => {
  loadSavedScripts();
  setupWebSocketConnection();
  setupTaskSubscription();
  startAutoCleanup();
});

// 组件卸载时清理
onUnmounted(() => {
  cleanupTaskSubscription();
  stopAutoCleanup();
});

// 设置 WebSocket 连接
const setupWebSocketConnection = () => {
  if (webSocketClient.getStatus() !== 'connected') {
    webSocketClient.connect();
  }
};

// 设置任务订阅
const setupTaskSubscription = () => {
  const unsubscribe = webSocketClient.subscribe('task:*', (message) => {
    const { type, data } = message.data;
    
    if (type === 'log') {
      handleTaskLog(data);
    } else if (type === 'status') {
      handleTaskStatusUpdate(data);
    } else if (type === 'result') {
      handleTaskResult(data);
    } else if (type === 'error') {
      handleTaskError(data);
    }
  });
  
  taskUnsubscribe.value = unsubscribe.unsubscribe;
};

// 清理任务订阅
const cleanupTaskSubscription = () => {
  if (taskUnsubscribe.value) {
    taskUnsubscribe.value();
    taskUnsubscribe.value = null;
  }
  
  // 如果有正在运行的任务，尝试取消
  if (currentTask.value?.status === 'running' || currentTask.value?.status === 'pending') {
    cancelCurrentTask();
  }
};

// 解析日志行并提取级别
const parseLogLine = (line: string): { level: string; message: string } => {
  let level = 'INFO';
  let message = line;
  
  // 尝试解析常见的日志格式
  const levelPatterns = [
    /\[(INFO|WARN|WARNING|ERROR|DEBUG|FATAL)\]/i,
    /(INFO|WARN|WARNING|ERROR|DEBUG|FATAL):/i,
    /^(\w+)\s+/i
  ];
  
  for (const pattern of levelPatterns) {
    const match = line.match(pattern);
    if (match) {
      level = match[1].toUpperCase();
      // 从消息中移除级别标记
      message = line.replace(match[0], '').trim();
      break;
    }
  }
  
  return { level, message };
};

// 处理任务日志
const handleTaskLog = (logData: any) => {
  const { taskId, level, message, timestamp } = logData;
  
  // 如果当前任务不存在或不是当前任务，跳过
  if (!currentTask.value || currentTask.value?.id !== taskId) return;
  
  const parsed = parseLogLine(message);
  const logLevel = level || parsed.level;
  const logMessage = parsed.message;
  
  const logEntry: LogEntry = {
    id: `${taskId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    raw: message,
    timestamp: timestamp || Date.now(),
    level: logLevel,
    taskId
  };
  
  // 添加到原始日志
  rawOutputLogs.value.push(logEntry);
  
  // 自动应用当前过滤条件
  autoApplyOutputFilter(logEntry);
  
  // 自动滚动到底部
  nextTick(() => {
    const outputContainer = document.querySelector('.output-text-container');
    if (outputContainer) {
      outputContainer.scrollTop = outputContainer.scrollHeight;
    }
  });
  
  // 确保输出标签页是活动的
  if (activeTab.value !== 'output') {
    activeTab.value = 'output';
  }
};

// 处理任务状态更新
const handleTaskStatusUpdate = (statusData: any) => {
  const { taskId, status, progress, elapsedTime } = statusData;
  if (!currentTask.value || currentTask.value?.id !== taskId) return;

  currentTask.value.status = status;
  currentTask.value.progress = progress || 0;
  
  if (elapsedTime) {
    currentTask.value.duration = elapsedTime;
  }
  
  taskStore.updateTaskStatus(taskId, status);
  
  if (status === 'running') {
    ElMessage.info(`任务 ${taskId} 开始执行`);
    activeTab.value = 'output';
  }
};

// 处理任务结果
const handleTaskResult = (resultData: any) => {
  const { taskId, result, executionTime } = resultData;
  
  if (!currentTask.value || currentTask.value?.id !== taskId) return;
  
  currentTask.value.status = 'completed';
  currentTask.value.progress = 100;
  currentTask.value.result = result;
  
  if (executionTime) {
    currentTask.value.duration = executionTime;
  }
  
  taskStore.updateTaskStatus(taskId, 'completed');
  
  const time = executionTime ? `${executionTime}s` : '完成';
  ElMessage.success(`任务 ${taskId} 执行${time}`);
  
  // 添加完成日志
  const logEntry: LogEntry = {
    id: `${taskId}_complete_${Date.now()}`,
    raw: `[${new Date().toLocaleTimeString()}] [INFO] 任务执行完成，耗时: ${time}`,
    timestamp: Date.now(),
    level: 'INFO',
    taskId
  };
  
  rawOutputLogs.value.push(logEntry);
  autoApplyOutputFilter(logEntry);
};

// 处理任务错误
const handleTaskError = (errorData: any) => {
  const { taskId, error, stackTrace } = errorData;
  
  if (!currentTask.value || currentTask.value?.id !== taskId) return;
  
  currentTask.value.status = 'failed';
  taskStore.updateTaskStatus(taskId, 'failed');
  
  // 构建错误信息
  let errorText = error || '任务执行失败';
  if (stackTrace) {
    errorText += `\n${stackTrace}`;
  }
  
  // 将错误信息按行分割，每行作为一个错误条目
  const errorLines = errorText.split('\n').filter((line: string) => line.trim());
  const timestamp = Date.now();
  
  errorLines.forEach((line: string) => {
    const errorEntry: ErrorEntry = {
      id: `${taskId}_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      raw: line,
      timestamp,
      taskId
    };
    
    rawErrorLogs.value.push(errorEntry);
  });
  
  // 应用错误过滤
  applyErrorFilter();
  
  // 切换到错误标签页
  activeTab.value = 'error';
  
  ElMessage.error(`任务 ${taskId} 执行失败`);
};

// 提交任务
const handleSubmitTask = async () => {
  if (!code.value.trim()) {
    ElMessage.warning('请输入要执行的代码');
    return;
  }
  
  submittingTask.value = true;
  
  try {
    // 清理之前的输出和错误
    clearAllLogs();
    
    // 清理之前的任务状态
    cleanupTask();
    
    // 创建新任务
    const taskData = {
      name: `脚本任务_${Date.now()}`,
      description: '通过脚本编辑器提交的任务',
      type: 'script' as const,
      language: 'python' as const,
      code: code.value,
      timeout: 300,
      parameters: {}
    };
    
    // 调用 API 创建任务
    const taskId = await taskStore.createTask(taskData);
    
    if (!taskId) {
      throw new Error('创建任务失败');
    }
    
    // 设置当前任务
    currentTask.value = {
      id: taskId,
      name: taskData.name,
      description: taskData.description,
      type: 'script',
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      language: 'python',
      code: code.value,
      logs: []
    };
    
    // 更新 Store
    taskStore.setCurrentTask(currentTask.value);
    
    // 应用初始过滤
    applyOutputFilter();
    applyErrorFilter();
    
    ElMessage.success(`任务 ${taskId} 已提交，等待执行`);
    
  } catch (err: any) {
    console.error('提交任务失败:', err);
    ElMessage.error(`提交任务失败: ${err.message || '未知错误'}`);
    
    // 显示错误
    const errorEntry: ErrorEntry = {
      id: `error_${Date.now()}`,
      raw: `提交任务失败: ${err.message || '未知错误'}`,
      timestamp: Date.now()
    };
    
    rawErrorLogs.value.push(errorEntry);
    applyErrorFilter();
    activeTab.value = 'error';
  } finally {
    submittingTask.value = false;
  }
};

// 取消当前任务
const handleCancelTask = async () => {
  if (!currentTask.value?.id) {
    ElMessage.warning('没有正在运行的任务');
    return;
  }
  
  if (!['pending', 'running'].includes(currentTask.value.status)) {
    ElMessage.warning('任务无法取消');
    return;
  }
  
  try {
    cancelingTask.value = true;
    
    const confirmed = await ElMessageBox.confirm(
      `确定要取消任务 "${currentTask.value.name || currentTask.value.id}" 吗？`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    if (confirmed) {
      await cancelCurrentTask();
      ElMessage.success('任务已取消');
    }
  } catch (err) {
    // 用户取消操作
    console.log('用户取消操作');
  } finally {
    cancelingTask.value = false;
  }
};

// 实际取消任务的逻辑
const cancelCurrentTask = async () => {
  if (!currentTask.value?.id) return;
  
  try {
    // 调用 API 取消任务
    await taskStore.cancelTask(currentTask.value.id);
    
    // 更新本地状态
    currentTask.value.status = 'cancelled';
    currentTask.value.progress = 0;
    
    // 添加取消日志
    const logEntry: LogEntry = {
      id: `${currentTask.value.id}_cancel_${Date.now()}`,
      raw: `[${new Date().toLocaleTimeString()}] [INFO] 任务已被取消`,
      timestamp: Date.now(),
      level: 'INFO',
      taskId: currentTask.value.id
    };
    
    rawOutputLogs.value.push(logEntry);
    autoApplyOutputFilter(logEntry);
    
  } catch (err: any) {
    console.error('取消任务失败:', err);
    ElMessage.error(`取消任务失败: ${err.message || '未知错误'}`);
  }
};

// 清理任务状态
const cleanupTask = () => {
  if (currentTask.value) {
    // 如果任务还在运行，先取消
    if (currentTask.value.status === 'pending' || currentTask.value.status === 'running') {
      cancelCurrentTask();
    }
    
    currentTask.value = null;
  }
};

// 清空所有日志
const clearAllLogs = () => {
  rawOutputLogs.value = [];
  rawErrorLogs.value = [];
  filteredOutputLogs.value = [];
  filteredErrorLogs.value = [];
};

// 应用输出过滤
const applyOutputFilter = () => {
  const { level, timeWindow, limit, keyword } = outputFilter.value;
  const now = Date.now();
  
  let filtered = [...rawOutputLogs.value];
  
  // 1. 时间窗口过滤
  if (timeWindow !== 'all') {
    let windowMs: number;
    switch (timeWindow) {
      case '1h': windowMs = 60 * 60 * 1000; break;
      case '30m': windowMs = 30 * 60 * 1000; break;
      case '15m': windowMs = 15 * 60 * 1000; break;
      case '5m': windowMs = 5 * 60 * 1000; break;
      case '1m': windowMs = 60 * 1000; break;
      default: windowMs = 60 * 60 * 1000;
    }
    
    const cutoffTime = now - windowMs;
    filtered = filtered.filter(log => log.timestamp >= cutoffTime);
  }
  
  // 2. 级别过滤
  if (level) {
    filtered = filtered.filter(log => log.level === level);
  }
  
  // 3. 关键词过滤
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filtered = filtered.filter(log => log.raw.toLowerCase().includes(lowerKeyword));
  }
  
  // 4. 数量限制
  if (limit !== 'all') {
    filtered = filtered.slice(-limit);
  }
  
  filteredOutputLogs.value = filtered;
  
  // 滚动到底部
  nextTick(() => {
    const outputContainer = document.querySelector('.output-text-container');
    if (outputContainer) {
      outputContainer.scrollTop = outputContainer.scrollHeight;
    }
  });
};

// 自动应用输出过滤
const autoApplyOutputFilter = (newLog: LogEntry) => {
  const { level, timeWindow, limit, keyword } = outputFilter.value;
  const now = Date.now();
  
  // 检查新日志是否符合当前过滤条件
  let shouldDisplay = true;
  
  // 时间窗口检查
  if (timeWindow !== 'all') {
    let windowMs: number;
    switch (timeWindow) {
      case '1h': windowMs = 60 * 60 * 1000; break;
      case '30m': windowMs = 30 * 60 * 1000; break;
      case '15m': windowMs = 15 * 60 * 1000; break;
      case '5m': windowMs = 5 * 60 * 1000; break;
      case '1m': windowMs = 60 * 1000; break;
      default: windowMs = 60 * 60 * 1000;
    }
    
    const cutoffTime = now - windowMs;
    if (newLog.timestamp < cutoffTime) {
      shouldDisplay = false;
    }
  }
  
  // 级别检查
  if (level && newLog.level !== level) {
    shouldDisplay = false;
  }
  
  // 关键词检查
  if (keyword && !newLog.raw.toLowerCase().includes(keyword.toLowerCase())) {
    shouldDisplay = false;
  }
  
  if (shouldDisplay) {
    filteredOutputLogs.value.push(newLog);
    
    // 如果超过限制，移除最旧的一条
    if (limit !== 'all' && filteredOutputLogs.value.length > limit) {
      filteredOutputLogs.value.shift();
    }
  }
};

// 应用错误过滤
const applyErrorFilter = () => {
  const { timeWindow, limit, keyword } = errorFilter.value;
  const now = Date.now();
  
  let filtered = [...rawErrorLogs.value];
  
  // 1. 时间窗口过滤
  if (timeWindow !== 'all') {
    let windowMs: number;
    switch (timeWindow) {
      case '1h': windowMs = 60 * 60 * 1000; break;
      case '30m': windowMs = 30 * 60 * 1000; break;
      case '15m': windowMs = 15 * 60 * 1000; break;
      case '5m': windowMs = 5 * 60 * 1000; break;
      case '1m': windowMs = 60 * 1000; break;
      default: windowMs = 60 * 60 * 1000;
    }
    
    const cutoffTime = now - windowMs;
    filtered = filtered.filter(log => log.timestamp >= cutoffTime);
  }
  
  // 2. 关键词过滤
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filtered = filtered.filter(log => log.raw.toLowerCase().includes(lowerKeyword));
  }
  
  // 3. 数量限制
  if (limit !== 'all') {
    filtered = filtered.slice(-limit);
  }
  
  filteredErrorLogs.value = filtered;
  
  // 滚动到底部
  nextTick(() => {
    const errorContainer = document.querySelector('.error-text-container');
    if (errorContainer) {
      errorContainer.scrollTop = errorContainer.scrollHeight;
    }
  });
};

// 清除输出过滤
const clearOutputFilter = () => {
  outputFilter.value = {
    level: '',
    timeWindow: '1h',
    limit: 1000,
    keyword: ''
  };
  applyOutputFilter();
};

// 清除错误过滤
const clearErrorFilter = () => {
  errorFilter.value = {
    timeWindow: '1h',
    limit: 200,
    keyword: ''
  };
  applyErrorFilter();
};

// 自动清理定时器
let autoCleanupTimer: number | null = null;

// 启动自动清理
const startAutoCleanup = () => {
  autoCleanupTimer = setInterval(() => {
    // 清理超过24小时的日志
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    
    rawOutputLogs.value = rawOutputLogs.value.filter(log => log.timestamp > cutoffTime);
    rawErrorLogs.value = rawErrorLogs.value.filter(log => log.timestamp > cutoffTime);
    
    // 重新应用过滤
    applyOutputFilter();
    applyErrorFilter();
    
    // 如果日志过多，清理一部分
    if (rawOutputLogs.value.length > 50000) {
      rawOutputLogs.value = rawOutputLogs.value.slice(-40000);
    }
    
    if (rawErrorLogs.value.length > 10000) {
      rawErrorLogs.value = rawErrorLogs.value.slice(-8000);
    }
  }, 5 * 60 * 1000); // 每5分钟清理一次
};

// 停止自动清理
const stopAutoCleanup = () => {
  if (autoCleanupTimer) {
    clearInterval(autoCleanupTimer);
    autoCleanupTimer = null;
  }
};

// 辅助函数：获取任务标签类型
const getTaskTagType = (status: TaskStatus) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'running': return 'primary';
    case 'completed': return 'success';
    case 'failed': return 'danger';
    case 'cancelled': return 'info';
    default: return '';
  }
};

// 辅助函数：获取任务状态文本
const getTaskStatusText = (status: TaskStatus) => {
  switch (status) {
    case 'pending': return '等待中';
    case 'running': return '运行中';
    case 'completed': return '已完成';
    case 'failed': return '已失败';
    case 'cancelled': return '已取消';
    default: return status;
  }
};

// 辅助函数：获取进度条状态
const getProgressStatus = (status: TaskStatus) => {
  switch (status) {
    case 'running': return undefined;
    case 'failed': return 'exception';
    case 'cancelled': return 'warning';
    default: return undefined;
  }
};

// 辅助函数：格式化时间
const formatTime = (time: string | Date) => {
  if (!time) return '';
  const date = typeof time === 'string' ? new Date(time) : time;
  return date.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 切换边栏状态
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  
  nextTick(() => {
    setTimeout(() => {
      if (editorRef.value?.refreshLayout) {
        editorRef.value.refreshLayout();
      }
    }, 300);
  });
};

// 加载保存的脚本
const loadSavedScripts = () => {
  try {
    const saved = localStorage.getItem('python_scripts');
    if (saved) {
      scriptList.value = JSON.parse(saved);
    }
  } catch (err) {
    console.error('加载脚本失败:', err);
  }
};

// 选择脚本
const selectScript = (script: any) => {
  activeScriptId.value = script.id;
};

// 保存脚本
const handleSave = async () => {
  if (!code.value.trim()) {
    ElMessage.warning('代码内容为空，无需保存');
    return;
  }
  
  saveForm.value.name = `script_${Date.now()}`;
  saveDialogVisible.value = true;
};

// 确认保存
const confirmSave = async () => {
  if (!saveForm.value.name.trim()) {
    ElMessage.warning('请输入脚本名称');
    return;
  }
  
  saving.value = true;
  
  try {
    const newScript = {
      id: Date.now().toString(),
      name: saveForm.value.name,
      description: saveForm.value.description,
      language: saveForm.value.language,
      code: code.value,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    };
    
    scriptList.value.unshift(newScript);
    
    // 保存到本地存储
    localStorage.setItem('python_scripts', JSON.stringify(scriptList.value));
    
    saveDialogVisible.value = false;
    isDirty.value = false;
    ElMessage.success('脚本保存成功');
    
    // 重置表单
    saveForm.value = {
      name: '',
      description: '',
      language: 'python'
    };
    
    // 切换到脚本标签页
    activeTab.value = 'scripts';
    activeScriptId.value = newScript.id;
  } catch (err) {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
};

// 格式化代码
const handleFormat = () => {
  const formatPythonCode = (code: string) => {
    let formatted = code;
    
    // 统一换行符
    formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 去除行尾空格
    formatted = formatted.replace(/[ \t]+$/gm, '');
    
    // 统一缩进为4个空格
    const lines = formatted.split('\n');
    const formattedLines = lines.map(line => {
      const match = line.match(/^(\s*)/);
      if (!match) return line;
      
      const indent = match[1];
      const tabCount = (indent.match(/\t/g) || []).length;
      const spaceCount = indent.length - tabCount;
      const totalSpaces = tabCount * 4 + spaceCount;
      
      const indentLevel = Math.floor(totalSpaces / 4);
      const newIndent = ' '.repeat(indentLevel * 4);
      
      return newIndent + line.trimStart();
    });
    
    let result = formattedLines.join('\n');
    if (!result.endsWith('\n')) {
      result += '\n';
    }
    
    return result;
  };
  
  const formattedCode = formatPythonCode(code.value);
  if (formattedCode !== code.value) {
    code.value = formattedCode;
    ElMessage.success('代码已格式化');
  } else {
    ElMessage.info('代码格式已符合规范');
  }
};

// 清空编辑器
const handleClear = () => {
  ElMessageBox.confirm(
    '确定要清空编辑器吗？所有未保存的更改都将丢失。',
    '确认清空',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    if (editorRef.value?.clear) {
      editorRef.value.clear();
    } else {
      code.value = '# Python脚本编辑器\n# 请输入你的Python代码...\n';
    }
    // 清空输出和错误
    clearAllLogs();
    ElMessage.success('编辑器已清空');
  }).catch(() => {
    // 用户取消
  });
};

// 插入模板
const insertTemplate = (type: string) => {
  const getTemplate = () => {
    switch (type) {
      case 'function':
        return `def my_function(param1, param2):
    """函数说明"""
    # 在这里写你的代码
    result = param1 + param2
    return result`;
        
      case 'class':
        return `class MyClass:
    """类说明"""
    
    def __init__(self, value):
        self.value = value
    
    def my_method(self):
        """方法说明"""
        return self.value * 2`;
        
      case 'import':
        return `import json
import os
import sys
from typing import List, Dict, Optional
import numpy as np
import pandas as pd
from datetime import datetime`;
        
      case 'main':
        return `if __name__ == "__main__":
    # 主程序入口
    print("程序开始执行")
    # 在这里添加你的主程序代码
    print("程序执行完成")`;
        
      case 'hello':
        return `# Hello World 示例
def hello_world():
    print("Hello, World!")
    return "Hello from Python"

if __name__ == "__main__":
    result = hello_world()
    print(f"函数返回值: {result}")`;
        
      default:
        return '';
    }
  };
  
  const template = getTemplate();
  
  let inserted = false;
  
  if (editorRef.value?.getEditor) {
    const editor = editorRef.value.getEditor();
    if (editor && typeof editor.executeEdits === 'function') {
      try {
        const selection = editor.getSelection();
        const position = selection.getStartPosition();
        
        const lineContent = editor.getModel().getLineContent(position.lineNumber);
        const insertPosition = {
          lineNumber: position.lineNumber,
          column: lineContent.length + 1
        };
        
        editor.executeEdits('insert-template', [{
          range: {
            startLineNumber: insertPosition.lineNumber,
            startColumn: insertPosition.column,
            endLineNumber: insertPosition.lineNumber,
            endColumn: insertPosition.column
          },
          text: '\n\n' + template,
          forceMoveMarkers: true
        }]);
        
        inserted = true;
      } catch (err) {
        console.warn('编辑器API插入失败:', err);
      }
    }
  }
  
  if (!inserted && editorRef.value?.setValue) {
    try {
      const currentValue = editorRef.value.getValue();
      const newValue = currentValue + '\n\n' + template;
      editorRef.value.setValue(newValue);
      inserted = true;
    } catch (err) {
      console.warn('setValue插入失败:', err);
    }
  }
  
  if (!inserted) {
    code.value += '\n\n' + template;
  }
  
  ElMessage.success('模板插入成功');
};

// 加载脚本
const loadScript = (script: any) => {
  if (currentTask.value?.status === 'running' || currentTask.value?.status === 'pending') {
    ElMessageBox.confirm(
      `当前有任务正在运行，确定要加载脚本 "${script.name}" 吗？当前任务将被取消。`,
      '确认加载',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      cancelCurrentTask();
      loadScriptContent(script);
    }).catch(() => {
      // 用户取消
    });
  } else {
    loadScriptContent(script);
  }
};

// 实际加载脚本内容
const loadScriptContent = (script: any) => {
  code.value = script.code;
  isDirty.value = false;
  activeTab.value = 'output';
  ElMessage.success('脚本加载成功');
};

// 删除脚本
const deleteScript = (script: any) => {
  ElMessageBox.confirm(
    `确定要删除脚本 "${script.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    scriptList.value = scriptList.value.filter(s => s.id !== script.id);
    localStorage.setItem('python_scripts', JSON.stringify(scriptList.value));
    ElMessage.success('脚本删除成功');
    
    if (activeScriptId.value === script.id) {
      activeScriptId.value = null;
    }
  }).catch(() => {
    // 用户取消
  });
};

// 显示保存对话框
const showSaveDialog = () => {
  saveDialogVisible.value = true;
};

// 获取行样式类
const getLineClass = (line: string) => {
  if (line.includes('[ERROR]') || line.includes('[FATAL]')) return 'error-line';
  if (line.includes('[WARN]') || line.includes('[WARNING]')) return 'warn-line';
  if (line.includes('[DEBUG]')) return 'debug-line';
  if (line.includes('[INFO]')) return 'info-line';
  return '';
};

</script>

<style scoped>
.python-editor {
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.editor-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.task-info-bar {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 12px;
}

.task-info-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.task-info-left,
.task-info-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-id {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 2px;
}

.task-name {
  font-weight: 500;
  color: #333;
}

.task-progress {
  color: #e6a23c;
  font-weight: 500;
}

.task-time,
.task-duration {
  color: #909399;
}

.editor-main {
  flex: 1;
  display: flex;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

.editor-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.editor-tools {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.editor-container {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.editor-sidebar {
  width: 350px;
  min-width: 350px;
  display: flex;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  flex-shrink: 0;
}

.editor-sidebar.collapsed {
  width: 40px;
  min-width: 40px;
}

.sidebar-toggle {
  width: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  transition: background 0.2s;
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background: #e4e7ed;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.sidebar-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.sidebar-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
}

/* 过滤工具栏样式 */
.filter-toolbar {
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 输出内容样式 */
.output-content,
.error-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.output-text-container,
.error-text-container {
  flex: 1;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  background: #fafafa;
  padding: 8px;
}

.output-line {
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  word-break: break-all;
}

.error-line {
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  word-break: break-all;
}

.output-line.error-line {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.05);
}

.output-line.warn-line {
  color: #e6a23c;
  background-color: rgba(230, 162, 60, 0.05);
}

.output-line.info-line {
  color: #409eff;
}

.output-line.debug-line {
  color: #67c23a;
  opacity: 0.8;
}

.error-line {
  color: #f56c6c;
}

.empty-placeholder {
  text-align: center;
  color: #909399;
  padding: 40px;
  font-size: 14px;
}

/* 脚本管理面板 */
.scripts-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scripts-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.scripts-header h4 {
  margin: 0;
  font-size: 16px;
}

.scripts-list {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.script-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.script-item:hover {
  background: #f5f7fa;
}

.script-item.active {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}

.script-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.script-icon {
  color: #409eff;
}

.script-name {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.script-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.script-item:hover .script-actions {
  opacity: 1;
}

.script-description {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.script-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #c0c4cc;
}

.script-time {
  font-family: 'Courier New', monospace;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px !important;
}
</style>