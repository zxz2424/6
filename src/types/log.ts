// 日志级别枚举（匹配后端日志管理模块）
export enum LogLevel {
  INFO = 'info', // 信息日志
  WARN = 'warn', // 警告日志
  ERROR = 'error', // 错误日志
  DEBUG = 'debug' // 调试日志
}

// 日志模块枚举（匹配后端7大核心模块）
export enum LogModule {
  COLLECT = 'collect', // 数据采集
  PROCESS = 'process', // 数据处理
  STORE = 'store', // 数据存储
  PUSH = 'push', // 实时推送
  API = 'api', // 业务API
  ALARM = 'alarm', // 告警引擎
  SYSTEM = 'system' // 系统日志
}

// 日志列表项类型
export interface LogItem {
  id: string | number; // 日志ID
  level: LogLevel; // 日志级别
  module: LogModule; // 所属模块
  operator: string; // 操作人/系统
  content: string; // 日志内容
  requestIp: string; // 请求IP
  createTime: string; // 日志创建时间(yyyy-MM-dd HH:mm:ss)
  detail?: string; // 日志详情（可选）
}

// 日志查询参数类型
export interface LogQueryParams {
  level?: LogLevel; // 日志级别
  module?: LogModule; // 日志模块
  operator?: string; // 操作人
  startTime?: string; // 开始时间(yyyy-MM-dd HH:mm:ss)
  endTime?: string; // 结束时间(yyyy-MM-dd HH:mm:ss)
  pageNum: number; // 当前页
  pageSize: number; // 每页条数
}

// 日志分页返回结果类型
export interface LogPageResult {
  list: LogItem[]; // 日志列表
  total: number; // 总条数
  pageNum: number; // 当前页
  pageSize: number; // 每页条数
}

// 日志导出参数类型
export interface LogExportParams extends Omit<LogQueryParams, 'pageNum' | 'pageSize'> {
  exportType: 'excel' | 'pdf'; // 导出格式
}