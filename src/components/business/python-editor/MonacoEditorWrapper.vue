<template>
  <div ref="containerRef" class="monaco-editor-wrapper">
    <!-- Monaco Editor 将通过 JavaScript 动态加载 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import loader from '@monaco-editor/loader'

interface Props {
  modelValue: string
  language?: string
  theme?: string
  readonly?: boolean
  options?: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'python',
  theme: 'vs-dark',
  readonly: false,
  options: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'editor-mounted': [editor: any]
}>()

const containerRef = ref<HTMLElement>()
let editor: any = null
let monaco: any = null

// 配置 Monaco 环境
const configureMonacoEnvironment = () => {
  if (typeof window !== 'undefined') {
    // 配置 Monaco Editor 的 CDN 路径
    loader.config({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
      }
    })
  }
}

// 初始化编辑器
const initEditor = async () => {
  if (!containerRef.value) return

  try {
    // 配置环境
    configureMonacoEnvironment()

    // 加载 Monaco Editor
    monaco = await loader.init()

    // 创建编辑器
    editor = monaco.editor.create(containerRef.value, {
      value: props.modelValue,
      language: props.language,
      theme: props.theme,
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: false,
      wordWrap: 'on',
      folding: true,
      showFoldingControls: 'mouseover',
      readOnly: props.readonly,
      tabSize: 4,
      insertSpaces: true,
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: { other: true, comments: true, strings: true },
      parameterHints: { enabled: true },
      'bracketPairColorization.enabled': true,
      'guides.bracketPairs': 'active',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      ...props.options
    })

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue()
      emit('update:modelValue', value)
    })

    // 监听编辑器布局变化
    window.addEventListener('resize', () => {
      if (editor) {
        editor.layout()
      }
    })

    emit('editor-mounted', editor)

    console.log('Monaco Editor 初始化成功')

  } catch (error) {
    console.error('初始化 Monaco Editor 失败:', error)
  }
}

// 监听属性变化
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
  }
})

watch(() => props.language, (newLanguage) => {
  if (editor && monaco) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLanguage)
    }
  }
})

watch(() => props.theme, (newTheme) => {
  if (editor && monaco) {
    monaco.editor.setTheme(newTheme)
  }
})

watch(() => props.readonly, (newReadonly) => {
  if (editor) {
    editor.updateOptions({ readOnly: newReadonly })
  }
})

// 组件生命周期
onMounted(() => {
  nextTick(() => {
    initEditor()
  })
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
  window.removeEventListener('resize', () => {})
})

// 暴露的方法
const setValue = (value: string) => {
  if (editor) {
    editor.setValue(value)
    return true
  }
  return false
}

const getValue = () => {
  if (editor) {
    return editor.getValue()
  }
  return ''
}

const clear = () => {
  return setValue('')
}

const formatCode = () => {
  if (editor) {
    editor.getAction('editor.action.formatDocument').run()
    return true
  }
  return false
}

const getEditor = () => {
  return editor
}

const refreshLayout = () => {
  if (editor) {
    editor.layout()
  }
}

defineExpose({
  setValue,
  getValue,
  clear,
  formatCode,
  getEditor,
  refreshLayout
})
</script>

<style scoped>
.monaco-editor-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>