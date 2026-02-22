// src/common/request/api/auth.ts
import { request } from '@/common/request/axios/request'
import type { LoginParams, LoginResponse, SystemSettingResponse, UserInfoResponse } from '@/types/system'

export const authApi = {
  // 登录接口
  login: (data: LoginParams) => 
    request.post<LoginResponse>('/Security/Login/Login', data),
  
  // 获取系统设置
  getSysSetting: () => 
    request.get<SystemSettingResponse>('/Base/GetSysSetting'),
  
  // 获取用户信息
  getUserInfo: () => 
    request.get<UserInfoResponse>('/Security/User/GetUserInfo'),
  
  // 退出登录
  logout: (token: string) => 
    request.post('/Security/Login/Logout', { token }),
  
  // 刷新Token
  refreshToken: (data: { token: string }) => 
    request.post<LoginResponse>('/Security/Login/RefreshToken', data)
}