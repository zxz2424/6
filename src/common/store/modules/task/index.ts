// /src/common/store/modules/task/index.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Task } from '@/types/task';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([]);
  const currentTask = ref<Task | null>(null);
  
  // 创建任务
  const createTask = async (taskData: any): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const task: Task = {
          id: taskId,
          name: taskData.name,
          description: taskData.description,
          type: 'script',
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
          language: taskData.language || 'python',
          code: taskData.code,
          logs: []
        };
        
        tasks.value.unshift(task);
        currentTask.value = task;
        
        // 模拟任务开始
        setTimeout(() => {
          updateTaskStatus(taskId, 'running');
          
          // 模拟进度更新
          let progress = 0;
          const progressInterval = setInterval(() => {
            if (progress >= 100) {
              clearInterval(progressInterval);
              updateTaskStatus(taskId, 'completed');
              return;
            }
            
            progress += Math.random() * 10 + 5;
            if (progress > 100) progress = 100;
            updateTaskProgress(taskId, progress);
          }, 500);
        }, 1000);
        
        resolve(taskId);
      }, 500);
    });
  };
  
  // 取消任务
  const cancelTask = async (taskId: string): Promise<void> => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && ['pending', 'running'].includes(task.status)) {
      task.status = 'cancelled';
      task.progress = 0;
      
      if (currentTask.value?.id === taskId) {
        currentTask.value = { ...task };
      }
    }
  };
  
  // 更新任务状态
  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      
      if (currentTask.value?.id === taskId) {
        currentTask.value.status = status;
      }
    }
  };
  
  // 更新任务进度
  const updateTaskProgress = (taskId: string, progress: number) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task) {
      task.progress = progress;
      
      if (currentTask.value?.id === taskId) {
        currentTask.value.progress = progress;
      }
    }
  };
  
  // 设置当前任务
  const setCurrentTask = (task: Task) => {
    currentTask.value = task;
  };
  
  return {
    tasks,
    currentTask,
    createTask,
    cancelTask,
    updateTaskStatus,
    updateTaskProgress,
    setCurrentTask
  };
});