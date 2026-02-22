// /src/common/request/websocket/task-websocket.ts

import { webSocketClient } from './index';
import type { WebSocketMessageHandler, WebSocketSubscription } from './types';

export interface TaskMessage {
  taskId: string;
  type: 'log' | 'status' | 'result' | 'error';
  data: any;
  timestamp: number;
}

export interface TaskLogMessage {
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: number;
}

export interface TaskStatusMessage {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  elapsedTime?: number; // 已运行时间(秒)
}

export class TaskWebSocketManager {
  private taskSubscriptions = new Map<string, WebSocketSubscription[]>();

  /**
   * 订阅任务更新
   */
  public subscribeToTask(
    taskId: string, 
    handler: WebSocketMessageHandler
  ): () => void {
    // 订阅任务特定的消息
    const subscription = webSocketClient.subscribe(
      `task:${taskId}`,
      handler
    );

    // 存储订阅以便后续清理
    if (!this.taskSubscriptions.has(taskId)) {
      this.taskSubscriptions.set(taskId, []);
    }
    this.taskSubscriptions.get(taskId)!.push(subscription);

    // 返回取消订阅的函数
    return () => {
      subscription.unsubscribe();
      const subscriptions = this.taskSubscriptions.get(taskId) || [];
      const index = subscriptions.indexOf(subscription);
      if (index > -1) {
        subscriptions.splice(index, 1);
      }
      if (subscriptions.length === 0) {
        this.taskSubscriptions.delete(taskId);
      }
    };
  }

  /**
   * 订阅所有任务更新（用于任务列表）
   */
  public subscribeToAllTasks(handler: WebSocketMessageHandler): () => void {
    const subscription = webSocketClient.subscribe(
      'task:*',
      handler
    );

    return () => subscription.unsubscribe();
  }

  /**
   * 取消订阅特定任务
   */
  public unsubscribeFromTask(taskId: string): void {
    const subscriptions = this.taskSubscriptions.get(taskId);
    if (subscriptions) {
      subscriptions.forEach(sub => sub.unsubscribe());
      this.taskSubscriptions.delete(taskId);
    }
  }

  /**
   * 清空所有任务订阅
   */
  public clearAllTaskSubscriptions(): void {
    this.taskSubscriptions.forEach(subscriptions => {
      subscriptions.forEach(sub => sub.unsubscribe());
    });
    this.taskSubscriptions.clear();
  }

  /**
   * 发送任务控制命令
   */
  public sendTaskCommand(taskId: string, command: string, data?: any): boolean {
    return webSocketClient.send('task:command', {
      taskId,
      command,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 取消任务
   */
  public cancelTask(taskId: string): boolean {
    return this.sendTaskCommand(taskId, 'cancel');
  }

  /**
   * 暂停任务
   */
  public pauseTask(taskId: string): boolean {
    return this.sendTaskCommand(taskId, 'pause');
  }

  /**
   * 继续任务
   */
  public resumeTask(taskId: string): boolean {
    return this.sendTaskCommand(taskId, 'resume');
  }

  /**
   * 获取活跃的任务订阅数量
   */
  public getActiveSubscriptions(): number {
    return this.taskSubscriptions.size;
  }
}

// 导出单例实例
export const taskWebSocketManager = new TaskWebSocketManager();

// 导出 Vue 组合式函数
export function useTaskWebSocket() {
  return taskWebSocketManager;
}