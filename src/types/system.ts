// 用户管理相关类型
export interface User {
  id: string;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  createTime: string;
  lastLoginTime?: string;
  roles: Role[];
}

export interface CreateUserParams {
  username: string;
  password: string;
  nickname: string;
  email: string;
  phone: string;
  roleIds: string[];
}

export interface UpdateUserParams extends Omit<CreateUserParams, 'password'> {
  id: string;
}

export interface UserQueryParams {
  page: number;
  size: number;
  keyword?: string;
  status?: string;
}

// 角色管理相关类型
export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  createTime: string;
  permissions: Permission[];
}

export interface CreateRoleParams {
  name: string;
  code: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateRoleParams extends CreateRoleParams {
  id: string;
}

// 权限管理相关类型
export interface Permission {
  id: string;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api' | 'data';
  parentId?: string;
  children?: Permission[];
  dataScope?: 'all' | 'custom' | 'dept' | 'self'; // 数据权限范围
}

// 系统配置相关类型
export interface SystemConfig {
  scene: SceneConfig;
  refresh: RefreshConfig;
  theme: ThemeConfig;
  security: SecurityConfig;
}

export interface SceneConfig {
  baseMap: 'amap' | 'tianditu' | 'custom';
  terrain: boolean;
  defaultView: ViewConfig;
}

export interface ViewConfig {
  longitude: number;
  latitude: number;
  height: number;
  heading: number;
  pitch: number;
}

export interface RefreshConfig {
  frequency: number;
  realtime: boolean;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
}

export interface SecurityConfig {
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  sessionTimeout: number;
}

// API响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  T: any;
}

export interface ListResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

// 告警级别枚举
export enum AlarmLevel {
  EMERGENCY = 'emergency',
  IMPORTANT = 'important',
  NORMAL = 'normal'
}

// 告警状态枚举
export enum AlarmStatus {
  UNHANDLED = 'unhandled',
  CONFIRMED = 'confirmed',
  CLEARED = 'cleared'
}

// 告警项类型
export interface AlarmItem {
  id: string;
  deviceId: string;
  deviceName: string;
  level: AlarmLevel;
  status: AlarmStatus;
  content: string;
  triggerReason: string;
  triggerTime: string;
  confirmTime?: string;
  confirmUser?: string;
  clearTime?: string;
  lng: number;
  lat: number;
  alt: number;
}

// 告警查询参数
export interface AlarmQueryParams {
  deviceName?: string;
  level?: AlarmLevel;
  status?: AlarmStatus;
  startTime?: string;
  endTime?: string;
  page?: number;
  size?: number;
}

// 告警操作参数
export interface AlarmOperateParams {
  id: string | string[];
  operator: string;
  remark?: string;
}

// 告警列表结果
export interface AlarmListResult {
  list: AlarmItem[];
  total: number;
  page: number;
  size: number;
}

// 告警统计
export interface AlarmStatistics {
  emergency: number;
  important: number;
  normal: number;
  unhandled: number;
  confirmed: number;
  cleared: number;
}

export interface LoginParams {
  Username: string
  Password: string
  Vcode?: string
  Vkey?: string
  AppId: string
  SystemCode: string
  Host: string
}

export interface LoginResponse {
  Success: boolean
  ErrCode: string
  ErrMsg: string
  ResData: {
    AccessToken: string
    TokenExpiresIn: string
  }
}

export interface UserInfoResponse {
  Success: boolean
  ResData: {
    Account: string
    NickName: string
    HeadIcon?: string
    Role: string[]
    SubSystemList: any[]
    ActiveSystem: string
    MenusRouter: any[]
    Modules: string[]
  }
}

export interface SystemSettingResponse {
  Success: boolean
  ResData: {
    SoftName: string
    SysLogo: string
    CompanyName: string
    CopyRight: string
    Webstatus: string
    Webclosereason: string
  }
}

export interface VerifyCodeResponse {
  Success: boolean
  ResData: {
    Key: string
    Img: string
  }
}