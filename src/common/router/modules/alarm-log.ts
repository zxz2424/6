// src/common/router/modules/alarm-log.ts
import type { RouteRecordRaw } from 'vue-router';

const alarmLogRoutes: RouteRecordRaw[] = [
  // 告警管理
  {
    path: '/alarm',
    name: 'AlarmManagement',
    component: () => import('@/pages/alarm/index.vue'),
    meta: {
      title: '告警管理',
      requiresAuth: true,
      permission: 'alarm:view',
      icon: 'Warning'
    }
  },
  // 日志管理
  {
    path: '/log',
    name: 'LogManagement',
    component: () => import('@/pages/log/index.vue').catch(err => {
      console.error('日志管理组件加载失败：', err);
      return import('@/pages/404/index.vue');
    }),
    meta: {
      title: '日志管理',
      requiresAuth: true,
      permission: 'log:view',
      icon: 'Document'
    }
  },
  // 监控告警（作为监控的子页面）
  {
    path: '/monitor/alarm',
    name: 'MonitorAlarm',
    component: () => import('@/pages/monitor/alarm/index.vue'),
    meta: {
      title: '监控告警',
      requiresAuth: true,
      permission: 'monitor:alarm:view',
      hidden: true // 不显示在主导航，通过监控页面访问
    }
  }
];

export default alarmLogRoutes;