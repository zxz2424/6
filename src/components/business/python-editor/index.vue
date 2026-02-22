<template>
  <div class="python-editor-container">
    <div class="editor-header">
      <el-button-group>
        <el-button @click="runCode" :icon="VideoPlay">运行</el-button>
        <el-button @click="saveCode" :icon="Document">保存</el-button>
        <el-button @click="formatCode" :icon="MagicStick">格式化</el-button>
      </el-button-group>
      
      <el-select v-model="currentFile" placeholder="选择脚本">
        <el-option
          v-for="file in scriptFiles"
          :key="file.value"
          :label="file.label"
          :value="file.value"
        />
      </el-select>
    </div>
    
    <div ref="editorRef" class="editor-content"></div>
    
    <div class="editor-output">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="输出" name="output">
          <pre>{{ outputContent }}</pre>
        </el-tab-pane>
        <el-tab-pane label="错误" name="error">
          <pre>{{ errorContent }}</pre>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as monaco from 'monaco-editor'
import { VideoPlay, Document, MagicStick } from '@element-plus/icons-vue'

const editorRef = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor

const currentFile = ref('')
const scriptFiles = ref([
  { label: '数据采集脚本', value: 'data_collect.py' },
  { label: '数据处理脚本', value: 'data_process.py' }
])

const activeTab = ref('output')
const outputContent = ref('')
const errorContent = ref('')

onMounted(() => {
  if (editorRef.value) {
    editor = monaco.editor.create(editorRef.value, {
      value: '# 输入你的Python代码\nprint("Hello, World!")',
      language: 'python',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false }
    })
  }
})

onUnmounted(() => {
  editor?.dispose()
})

const runCode = () => {
  const code = editor.getValue()
  // 调用后端API执行Python代码
  outputContent.value = '执行中...'
}

const saveCode = () => {
  const code = editor.getValue()
  // 调用后端API保存代码
}

const formatCode = () => {
  // 代码格式化逻辑
}
</script>

<style scoped>
.python-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-content {
  flex: 1;
  min-height: 400px;
}

.editor-output {
  height: 200px;
  border-top: 1px solid #e4e7ed;
}
</style>