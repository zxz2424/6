// /src/types/task.ts
export type TaskStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface Task {
  id: string;
  name: string;
  description?: string;
  type: 'script' | 'data' | 'analysis';
  status: TaskStatus;
  progress: number; // 0-100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number; // 运行时间(秒)
  result?: any;
  logs: string[];
  
  // 脚本任务特有
  language?: 'python' | 'javascript' | 'shell';
  code?: string;
  parameters?: Record<string, any>;
  timeout?: number; // 超时时间(秒)
  error?: string;
}