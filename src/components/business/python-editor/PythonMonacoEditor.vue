<template>
  <div ref="containerRef" class="python-monaco-editor-container">
    <div ref="editorContainer" class="python-monaco-editor"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

// ========== TypeScript 类型定义 ==========
interface MonacoEditor {
  editor: any;
  languages: any;
  Range: any;
}

interface Position {
  lineNumber: number;
  column: number;
}

interface WordInfo {
  word: string;
  startColumn: number;
  endColumn: number;
}

interface CompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
  insertTextRules?: number;
  range?: any;
}

interface SuggestionItem {
  label: string;
  kind: number;
  detail: string;
  documentation: string;
  insertText?: string;
  insertTextRules?: number;
  snippet?: string;
  doc?: string;
  type?: string;
}

interface Props {
  modelValue: string;
  language?: string;
  theme?: string;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'python',
  theme: 'vs-dark',
  readonly: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'editor-mounted': [editor: any];
  'resize': [dimensions: { width: number; height: number }];
}>();

// ========== 组件引用和状态 ==========
const containerRef = ref<HTMLElement>();
const editorContainer = ref<HTMLElement>();
let editor: any = null;
let monacoInstance: any = null;
let resizeObserver: ResizeObserver | null = null;

// ========== Monaco 环境配置 ==========
const configureMonacoEnvironment = () => {
  if (typeof window !== 'undefined') {
    (window as any).MonacoEnvironment = {
      getWorkerUrl: function(_moduleId: string, label: string) {
        console.log('Loading worker for:', label);
        
        if (label === 'python') {
          return '/monacoeditorwork/editor.worker.js';
        }
        if (label === 'json') {
          return '/monacoeditorwork/json.worker.js';
        }
        if (label === 'html') {
          return '/monacoeditorwork/html.worker.js';
        }
        if (label === 'css') {
          return '/monacoeditorwork/css.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return '/monacoeditorwork/ts.worker.js';
        }
        
        return '/monacoeditorwork/editor.worker.js';
      }
    };
  }
};

// ========== 加载 Monaco Editor (修复版) ==========
const loadMonacoEditor = async (): Promise<MonacoEditor> => {
  try {
    // 先检查全局是否已存在 monaco
    if ((window as any).monaco) {
      const globalMonaco = (window as any).monaco;
      if (globalMonaco.editor && globalMonaco.languages) {
        console.log('使用全局 Monaco Editor');
        return globalMonaco;
      }
    }

    // 动态导入 monaco-editor
    console.log('开始动态导入 Monaco Editor...');
    
    // 方法1：使用完整的命名空间导入
    const monacoModule = await import('monaco-editor');
    
    // 将模块转换为 any 类型以避免 TypeScript 错误
    const moduleAny = monacoModule as any;
    
    // 调试：查看模块结构
    console.log('Monaco 模块结构:', Object.keys(moduleAny));
    console.log('Monaco 默认导出:', moduleAny.default ? '存在' : '不存在');
    
    // 尝试不同的访问方式
    let monaco: any = null;
    
    // 情况1：模块本身包含 editor 和 languages
    if (moduleAny.editor && moduleAny.languages) {
      console.log('使用模块导出的 editor 和 languages');
      monaco = moduleAny;
    }
    // 情况2：默认导出包含 editor 和 languages
    else if (moduleAny.default && moduleAny.default.editor && moduleAny.default.languages) {
      console.log('使用默认导出的 editor 和 languages');
      monaco = moduleAny.default;
    }
    // 情况3：模块本身就是我们需要的对象
    else if (moduleAny) {
      console.log('使用整个模块作为 Monaco 实例');
      monaco = moduleAny;
    }
    
    if (monaco && monaco.editor && monaco.languages) {
      console.log('Monaco Editor 加载成功');
      return monaco;
    }
    
    throw new Error('无法从导入的模块中获取有效的 Monaco Editor 实例');
    
  } catch (error) {
    console.error('加载 Monaco Editor 失败:', error);
    
    // 最后尝试使用全局 monaco
    if ((window as any).monaco) {
      console.log('降级到全局 Monaco');
      return (window as any).monaco;
    }
    
    throw error;
  }
};

// ========== 安全获取 Monaco APIs ==========
const getMonacoAPIs = (monaco: MonacoEditor) => {
  // 定义 CompletionItemKind 的枚举值
  const CompletionItemKind = {
    Function: 1,
    Method: 0,
    Constructor: 4,
    Field: 5,
    Variable: 6,
    Class: 7,
    Interface: 8,
    Module: 9,
    Property: 10,
    Unit: 11,
    Value: 12,
    Enum: 13,
    Keyword: 14,
    Snippet: 15,
    Color: 16,
    File: 17,
    Reference: 18,
    Folder: 19,
    EnumMember: 20,
    Constant: 21,
    Struct: 22,
    Event: 23,
    Operator: 24,
    TypeParameter: 25
  };
  
  const CompletionItemInsertTextRule = {
    InsertAsSnippet: 4,
    KeepWhitespace: 1
  };
  
  return {
    languages: monaco.languages || {},
    editor: monaco.editor || {},
    Range: monaco.Range || class Range {
      constructor(
        public startLineNumber: number,
        public startColumn: number,
        public endLineNumber: number,
        public endColumn: number
      ) {}
    },
    CompletionItemKind,
    CompletionItemInsertTextRule
  };
};

// ========== 构建补全建议 ==========
const buildCompletionSuggestions = (monacoAPIs: any): SuggestionItem[] => {
  const suggestions: SuggestionItem[] = [];
  const { CompletionItemKind, CompletionItemInsertTextRule } = monacoAPIs;
  
  // 1. Python 关键字
  const keywords = [
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
    'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
    'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
    'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
    'True', 'False', 'None'
  ];
  
  keywords.forEach(keyword => {
    suggestions.push({
      label: keyword,
      kind: CompletionItemKind.Keyword,
      detail: 'Python 关键字',
      documentation: `Python 语言关键字: ${keyword}`,
      insertText: keyword
    });
  });
  
  // 2. 内置函数
  const builtinFunctions = [
    { label: 'print', snippet: 'print(${1:value})', doc: '输出内容到控制台' },
    { label: 'len', snippet: 'len(${1:obj})', doc: '返回对象的长度' },
    { label: 'range', snippet: 'range(${1:start}, ${2:stop}, ${3:step})', doc: '生成整数序列' },
    { label: 'type', snippet: 'type(${1:obj})', doc: '返回对象类型' },
    { label: 'str', snippet: 'str(${1:obj})', doc: '转换为字符串' },
    { label: 'int', snippet: 'int(${1:value})', doc: '转换为整数' },
    { label: 'float', snippet: 'float(${1:value})', doc: '转换为浮点数' },
    { label: 'list', snippet: 'list(${1:iterable})', doc: '转换为列表' },
    { label: 'dict', snippet: 'dict(${1:iterable})', doc: '创建字典' },
    { label: 'set', snippet: 'set(${1:iterable})', doc: '创建集合' },
    { label: 'tuple', snippet: 'tuple(${1:iterable})', doc: '转换为元组' },
    { label: 'abs', snippet: 'abs(${1:number})', doc: '返回绝对值' },
    { label: 'sum', snippet: 'sum(${1:iterable})', doc: '求和' },
    { label: 'min', snippet: 'min(${1:iterable})', doc: '返回最小值' },
    { label: 'max', snippet: 'max(${1:iterable})', doc: '返回最大值' },
    { label: 'sorted', snippet: 'sorted(${1:iterable})', doc: '返回排序列表' },
  ];
  
  builtinFunctions.forEach(func => {
    suggestions.push({
      label: func.label,
      kind: CompletionItemKind.Function,
      detail: 'Python 内置函数',
      documentation: func.doc,
      insertText: func.snippet,
      snippet: func.snippet,
      doc: func.doc,
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet
    });
  });
  
  // 3. 标准库模块
  const stdModules = [
    'os', 'sys', 'json', 'datetime', 'math', 're', 'random', 
    'collections', 'itertools', 'functools', 'time', 'pathlib'
  ];
  
  stdModules.forEach(module => {
    suggestions.push({
      label: module,
      kind: CompletionItemKind.Module,
      detail: 'Python 标准库',
      documentation: `导入 ${module} 模块: import ${module}`,
      insertText: module
    });
  });
  
  // 4. 第三方库示例 (NumPy)
  const numpyFunctions = ['array', 'linspace', 'arange', 'zeros', 'ones', 'mean', 'sum'];
  numpyFunctions.forEach(func => {
    suggestions.push({
      label: `np.${func}`,
      kind: CompletionItemKind.Function,
      detail: 'NumPy 函数',
      documentation: `NumPy 函数: np.${func}`,
      insertText: `np.${func}(${1})`,
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet
    });
  });
  
  // 5. 平台专用函数 (3D可视化平台)
  const platformFunctions = [
    { label: 'load_3d_model', snippet: 'load_3d_model(${1:path})', doc: '加载3D模型文件' },
    { label: 'create_scene', snippet: 'create_scene(${1:config})', doc: '创建3D场景' },
    { label: 'add_data_point', snippet: 'add_data_point(${1:x}, ${2:y}, ${3:z})', doc: '添加数据点到场景' },
  ];
  
  platformFunctions.forEach(func => {
    suggestions.push({
      label: func.label,
      kind: CompletionItemKind.Function,
      detail: '平台专用',
      documentation: func.doc,
      insertText: func.snippet,
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet
    });
  });
  
  return suggestions;
};

// ========== 初始化编辑器 ==========
const initEditor = async () => {
  if (!editorContainer.value || !containerRef.value) return;

  try {
    console.log('开始初始化 Monaco Editor...');

    // 获取容器尺寸
    const containerWidth = containerRef.value.clientWidth;
    const containerHeight = containerRef.value.clientHeight;

    // 清除容器内容
    editorContainer.value.innerHTML = '';

    // 配置环境
    configureMonacoEnvironment();

    // 加载 Monaco Editor
    const monaco = await loadMonacoEditor();
    console.log('Monaco Editor 加载成功');

    // 保存 monaco 实例
    monacoInstance = monaco;

    // 获取安全的 API 访问
    const monacoAPIs = getMonacoAPIs(monaco);
    
    // 预构建补全建议
    const allSuggestions = buildCompletionSuggestions(monacoAPIs);

    // ========== 注册补全提供者 ==========
    if (monacoAPIs.languages && monacoAPIs.languages.registerCompletionItemProvider) {
      monacoAPIs.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.', ' ', '(', '\'', '"', ':'],
        
        provideCompletionItems: (
          model: any, 
          position: Position
        ) => {
          const wordInfo: WordInfo = model.getWordUntilPosition(position);
          const currentWord = wordInfo.word;
          const lineContent = model.getLineContent(position.lineNumber);
          const lineUntilCursor = lineContent.substring(0, position.column - 1);
          
          console.log(`补全触发: 当前单词 "${currentWord}", 行文本 "${lineUntilCursor}"`);

          // 智能过滤建议
          let filteredSuggestions = allSuggestions;
          
          if (currentWord) {
            filteredSuggestions = allSuggestions.filter(item => {
              const label = item.label.toLowerCase();
              const word = currentWord.toLowerCase();
              
              // 前缀匹配
              if (label.startsWith(word)) return true;
              
              // 对于带点的方法名，匹配最后一部分
              if (label.includes('.')) {
                const lastPart = label.split('.').pop();
                if (lastPart && lastPart.startsWith(word)) return true;
              }
              
              return false;
            });
          } else if (lineUntilCursor.trim().endsWith('import ')) {
            // import 语句后优先显示模块
            filteredSuggestions = allSuggestions.filter(
              item => item.kind === monacoAPIs.CompletionItemKind.Module
            );
          } else if (lineUntilCursor.trim().endsWith('from ')) {
            // from 语句后优先显示模块
            filteredSuggestions = allSuggestions.filter(
              item => item.kind === monacoAPIs.CompletionItemKind.Module
            );
          }

          // 限制返回数量
          const maxSuggestions = 100;
          if (filteredSuggestions.length > maxSuggestions) {
            filteredSuggestions = filteredSuggestions.slice(0, maxSuggestions);
          }

          // 构建最终补全项
          const finalSuggestions: CompletionItem[] = filteredSuggestions.map(suggestion => {
            const completionItem: CompletionItem = {
              label: suggestion.label,
              kind: suggestion.kind,
              detail: suggestion.detail,
              documentation: suggestion.documentation,
              insertText: suggestion.insertText || suggestion.label,
              range: new monacoAPIs.Range(
                position.lineNumber,
                wordInfo.startColumn,
                position.lineNumber,
                wordInfo.endColumn
              )
            };
            
            if (suggestion.insertTextRules) {
              completionItem.insertTextRules = suggestion.insertTextRules;
            }
            
            return completionItem;
          });

          console.log(`返回 ${finalSuggestions.length} 条补全建议`);
          
          return {
            suggestions: finalSuggestions,
            incomplete: false
          };
        },
        
        resolveCompletionItem: (item: CompletionItem) => {
          return item;
        }
      });
      
      console.log('Python 增强补全提供者已注册');
    } else {
      console.warn('无法注册补全提供者：languages API 不可用');
    }

    // ========== 创建编辑器实例 ==========
    if (monacoAPIs.editor && monacoAPIs.editor.create) {
      editor = monacoAPIs.editor.create(editorContainer.value, {
        value: props.modelValue || '# Python脚本编辑器\n# 请输入你的Python代码...\n',
        language: 'python',
        theme: props.theme,
        fontSize: 14,
        lineNumbers: 'on',
        minimap: { 
          enabled: false
        },
        scrollBeyondLastLine: false,
        automaticLayout: false,
        wordWrap: 'on',
        folding: true,
        showFoldingControls: 'mouseover',
        lineDecorationsWidth: 5,
        lineNumbersMinChars: 3,
        roundedSelection: false,
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          useShadows: false
        },
        readOnly: props.readonly,
        tabSize: 4,
        insertSpaces: true,
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        snippetSuggestions: 'inline',
        dimension: {
          width: containerWidth,
          height: containerHeight
        },
        quickSuggestions: {
          other: true,
          comments: true,
          strings: true
        },
        parameterHints: {
          enabled: true
        },
        'bracketPairColorization.enabled': true,
        'guides.bracketPairs': 'active',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoSurround: 'languageDefined',
        suggest: {
          showIcons: true,
          showStatusBar: true,
          preview: true,
          showMethods: true,
          showFunctions: true,
          showConstructors: true,
          showFields: true,
          showVariables: true,
          showClasses: true,
          showStructs: true,
          showInterfaces: true,
          showModules: true,
          showProperties: true,
          showEvents: true,
          showOperators: true,
          showUnits: true,
          showValues: true,
          showConstants: true,
          showEnums: true,
          showEnumMembers: true,
          showKeywords: true,
          showWords: true,
          showColors: true,
          showFiles: true,
          showReferences: true,
          showFolders: true,
          showTypeParameters: true,
          showSnippets: true
        }
      });
      
      console.log('编辑器创建成功');

      // 监听内容变化
      editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        emit('update:modelValue', value);
      });
      
      // 初始化ResizeObserver
      initResizeObserver();
      
      // 触发编辑器加载完成事件
      emit('editor-mounted', editor);
      
      console.log('Python Monaco Editor 初始化完成');
    } else {
      console.error('无法创建编辑器：editor API 不可用');
      createFallbackEditor();
    }
    
  } catch (error) {
    console.error('初始化 Monaco Editor 失败:', error);
    createFallbackEditor();
  }
};

// ========== 初始化ResizeObserver ==========
const initResizeObserver = () => {
  if (!containerRef.value || !editor) return;
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      
      if (editor && typeof editor.layout === 'function') {
        editor.layout({
          width: Math.max(width, 100),
          height: Math.max(height, 100)
        });
        
        emit('resize', { width, height });
      }
    }
  });
  
  resizeObserver.observe(containerRef.value);
};

// ========== 手动更新编辑器尺寸 ==========
const updateEditorSize = () => {
  if (!containerRef.value || !editor) return;
  
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  
  if (editor && typeof editor.layout === 'function') {
    editor.layout({
      width: Math.max(width, 100),
      height: Math.max(height, 100)
    });
    
    emit('resize', { width, height });
  }
};

// ========== 创建降级编辑器 ==========
const createFallbackEditor = () => {
  if (!editorContainer.value || !containerRef.value) return;
  
  const textarea = document.createElement('textarea');
  textarea.style.width = '100%';
  textarea.style.height = '100%';
  textarea.style.border = '1px solid #dcdfe6';
  textarea.style.borderRadius = '4px';
  textarea.style.outline = 'none';
  textarea.style.padding = '10px';
  textarea.style.fontFamily = "'Courier New', monospace";
  textarea.style.fontSize = '14px';
  textarea.style.resize = 'none';
  textarea.style.boxSizing = 'border-box';
  textarea.value = props.modelValue;
  textarea.placeholder = '# Python Script Editor\n# 请输入你的Python代码...';
  
  textarea.addEventListener('input', (e) => {
    const value = (e.target as HTMLTextAreaElement).value;
    emit('update:modelValue', value);
  });
  
  editorContainer.value.innerHTML = '';
  editorContainer.value.appendChild(textarea);
  editor = textarea;
};

// ========== 安全销毁编辑器 ==========
const safeDispose = () => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  
  if (editor && typeof editor.dispose === 'function') {
    try {
      editor.dispose();
    } catch (error) {
      console.error('Error disposing editor:', error);
    }
    editor = null;
  }
};

// ========== 监听属性变化 ==========
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue?.()) {
    try {
      editor.setValue(newValue);
    } catch (error) {
      console.error('Error setting editor value:', error);
    }
  }
});

watch(() => props.language, (newLanguage) => {
  if (editor && monacoInstance) {
    const model = editor.getModel?.();
    if (model) {
      monacoInstance.editor.setModelLanguage(model, newLanguage);
    }
  }
});

watch(() => props.readonly, (newReadonly) => {
  if (editor && typeof editor.updateOptions === 'function') {
    editor.updateOptions({ readOnly: newReadonly });
  }
});

// ========== 组件生命周期 ==========
onMounted(async () => {
  await nextTick();
  await initEditor();
  
  setTimeout(() => {
    updateEditorSize();
  }, 100);
});

onUnmounted(() => {
  safeDispose();
});

// ========== 暴露的方法 ==========
const setValue = (value: string) => {
  if (editor) {
    if (typeof editor.setValue === 'function') {
      editor.setValue(value);
    } else if (editor.tagName === 'TEXTAREA') {
      editor.value = value;
    }
    return true;
  }
  return false;
};

const getValue = () => {
  if (editor) {
    if (typeof editor.getValue === 'function') {
      return editor.getValue();
    } else if (editor.tagName === 'TEXTAREA') {
      return editor.value;
    }
  }
  return '';
};

const clear = () => {
  return setValue('# Python Script Editor\n# 请输入你的Python代码...\n');
};

const formatCode = () => {
  if (editor && typeof editor.getAction === 'function') {
    const action = editor.getAction('editor.action.formatDocument');
    if (action) {
      action.run();
      return true;
    }
  }
  return false;
};

const getEditor = () => {
  return editor;
};

const refreshLayout = () => {
  updateEditorSize();
};

defineExpose({
  setValue,
  getValue,
  clear,
  formatCode,
  getEditor,
  refreshLayout
});
</script>

<style scoped>
.python-monaco-editor-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.python-monaco-editor {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>