// src/types/vite-plugin-monaco-editor.d.ts
declare module 'vite-plugin-monaco-editor' {
  import { Plugin } from 'vite'
  
  // 插件函数
  export function monacoEditorPlugin(options?: any): Plugin
  
  // 默认导出是一个包含 default 属性的对象
  const pluginModule: {
    default: typeof monacoEditorPlugin
    resolveMonacoPath: Function
    getWorks: Function
    isCDN: Function
  }
  
  export default pluginModule
}