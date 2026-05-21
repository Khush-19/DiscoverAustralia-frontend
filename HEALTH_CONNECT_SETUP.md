# Health Connect 配置指南

## 概述
本项目使用 `expo-health-connect` 来获取用户的运动步数数据，替代之前的睡眠追踪功能。

## 安装
```bash
npm install expo-health-connect
```

## Android 配置

### 1. 添加 Health Connect 权限
在 `android/app/src/main/AndroidManifest.xml` 中添加：

```xml
<uses-permission android:name="android.permission.health.READ_STEPS" />
```

### 2. 预构建项目
```bash
npx expo prebuild --platform android
```

### 3. 运行应用
```bash
npx expo run:android
```

## iOS 配置
Health Connect 目前主要支持 Android。对于 iOS，需要使用 Apple HealthKit。
如果需要 iOS 支持，可以考虑使用 `react-native-health` 库。

## 使用说明

### 获取步数
```javascript
import { getTodaySteps } from './services/HealthService';

const steps = await getTodaySteps();
console.log('Today steps:', steps);
```

### 请求权限
```javascript
import { requestHealthPermissions } from './services/HealthService';

const granted = await requestHealthPermissions();
if (granted) {
  console.log('Health permissions granted');
}
```

## 当前实现

### UserContext
- 移除了 `sleepHours` 字段
- 只保留 `steps` 字段
- 每 5 分钟自动刷新步数数据

### InsightCard
- 移除了睡眠相关的显示和逻辑
- 只显示步数信息
- 当步数低于 7000 时显示提醒卡片

### useAuraIntelligence
- 移除了睡眠相关的评分逻辑
- 只基于步数进行生物特征评分
- 低步数（< 3000）推荐低强度活动
- 高步数（> 8000）推荐高强度活动

### LocationDetailScreen
- 移除了睡眠信息显示
- 只显示步数和匹配度

## 开发测试
如果设备不支持 Health Connect 或权限未授予，服务会返回模拟数据（3000-8000 之间的随机步数）。

## 注意事项
1. Health Connect 需要 Android 9+ 且安装了 Health Connect 应用
2. 用户需要手动授予步数读取权限
3. 首次使用时会提示用户安装 Health Connect（如果未安装）
