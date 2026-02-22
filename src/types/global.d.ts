// global.d.ts
/// <reference types="vite/client" />
/// <reference types="@types/node" />

// 声明 vite-plugin-monaco-editor
declare module 'vite-plugin-monaco-editor' {
  import { Plugin } from 'vite';
  export default function monacoEditorPlugin(): Plugin;
}