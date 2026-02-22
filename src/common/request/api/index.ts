// 修改 src/common/request/api/index.ts
import { userApi } from './user';
import { systemApi } from './system';
import { monitorApi } from './monitor';
import { scriptApi } from './script';
import { taskApi } from './task';
// 新增
import { alarmApi } from './alarm';
import { logApi } from './log';

export const api = {
  user: userApi,
  system: systemApi,
  monitor: monitorApi,
  script: scriptApi,
  task: taskApi,
  // 新增
  alarm: alarmApi,
  log: logApi
};