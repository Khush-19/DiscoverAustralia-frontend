# 消息功能实现说明

## 概述
在Home页面右上角添加了一个圆形消息按钮，点击后打开消息界面，显示所有用户消息。

## 实现的文件

### 1. 服务层
- **`services/messageService.js`** - 消息API服务
  - `getAllMessages()` - 获取所有消息
  - `markMessageAsRead(messageId)` - 标记消息为已读

### 2. 自定义Hook
- **`hooks/useUnreadMessageCount.js`** - 未读消息数量Hook
  - 自动轮询获取未读消息数量（默认30秒间隔）
  - 返回未读数、加载状态、错误信息和刷新函数

### 3. 屏幕组件
- **`screens/MessagesScreen.jsx`** - 消息列表界面
  - 显示所有消息，按时间倒序排列
  - 支持下拉刷新
  - 根据消息类型（kind）自动生成颜色标签
  - 显示未读/已读状态
  - 空状态和错误状态处理

### 4. 导航配置
- **`navigation/RootNavigator.jsx`** - 添加了Messages路由

### 5. Home页面更新
- **`screens/HomeScreen.jsx`** 
  - 右上角头像替换为邮件图标按钮
  - 显示未读消息数量徽章（超过99显示"99+"）
  - 点击跳转到消息页面

## 颜色生成算法

消息类型（kind）的颜色通过哈希算法自动生成：

```javascript
function generateKindColor(kind) {
  // 对kind字符串进行哈希计算
  let hash = 0;
  for (let i = 0; i < kind.length; i++) {
    hash = kind.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 从预定义的调色板中选择颜色
  const colors = [
    { backgroundColor: '#3B82F6', textColor: '#FFFFFF' }, // Blue
    { backgroundColor: '#10B981', textColor: '#FFFFFF' }, // Green
    { backgroundColor: '#F59E0B', textColor: '#FFFFFF' }, // Amber
    // ... 更多颜色
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
```

**特点：**
- ✅ 相同的kind总是生成相同的颜色
- ✅ 不同的kind生成不同的颜色
- ✅ 颜色来自精心挑选的调色板，保证美观

**示例：**
- `"system"` → 固定颜色A
- `"notification"` → 固定颜色B
- `"alert"` → 固定颜色C

## API接口

### 获取所有消息
```
GET /api/core/getAllMessage
Headers: Authorization: Bearer <token>
Response: Array of message objects
```

### 消息数据结构
```javascript
{
  "id": {
    "timestamp": 1779267996,
    "date": "2026-05-20T09:06:36.000+00:00"
  },
  "email": "example@email.com",
  "read": false,
  "kind": "system",        // system, notification, alert, etc.
  "title": "newMessage12",
  "content": "!youGetOneNew!",
  "createdAt": "2026-05-20T08:09:03.356Z",
  "remind": true
}
```

## UI特性

### 消息卡片
- 📧 左侧蓝色竖条表示未读消息
- 🏷️ 彩色标签显示消息类型（带图标）
- ⏰ 相对时间显示（"5m ago", "2h ago", "3d ago"等）
- 👁️ 右下角图标显示已读/未读状态
- 📱 响应式设计，适配深色/浅色主题

### 消息类型图标
- `alert` → ⚠️ 红色警告图标
- `notification` → 🔔 蓝色铃铛图标
- `system` → ℹ️ 绿色信息图标
- 其他 → ✉️ 灰色邮件图标

### 头部徽章
- 显示未读消息总数
- 超过99显示"99+"
- 实时更新（每30秒轮询）

## 使用方式

1. **查看消息**：点击Home页面右上角的邮件图标
2. **刷新消息**：在消息页面下拉即可刷新
3. **返回主页**：点击左上角返回箭头

## 后续扩展建议

1. **消息详情页面**：点击消息卡片查看详细内容
2. **标记已读功能**：调用`markMessageAsRead` API
3. **删除消息功能**：添加删除按钮
4. **消息分类筛选**：按kind过滤消息
5. **推送通知**：新消息到达时发送推送
6. **搜索功能**：搜索消息标题或内容

## 注意事项

- API地址配置在 `.env` 文件中：`EXPO_PUBLIC_API_URL=http://192.168.1.101:8080`
- 需要用户登录后才能访问（使用JWT token认证）
- 消息轮询会在后台持续运行，消耗少量网络资源
- 如需调整轮询间隔，修改`useUnreadMessageCount(30000)`的参数（单位：毫秒）
