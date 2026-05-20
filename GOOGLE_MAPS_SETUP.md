# Google Maps API Key 配置指南

## 1. 获取 Google Maps API Key

### 步骤：
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用以下 API：
   - **Maps SDK for Android**（Android 应用必需）
   - **Maps SDK for iOS**（iOS 应用必需）
   - **Geocoding API**（可选，用于地址解析）
4. 前往 "Credentials" → "Create Credentials" → "API Key"
5. 复制生成的 API Key

## 2. 在 .env 文件中配置

打开项目根目录的 `.env` 文件，将 `YOUR_GOOGLE_MAPS_API_KEY_HERE` 替换为你的实际 API Key：

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=你的实际API密钥
```

**重要提示：**
- ⚠️ 不要将真实的 API Key 提交到 Git 仓库
- ✅ `.env` 文件已在 `.gitignore` 中，不会被提交

## 3. 限制 API Key（推荐）

为了安全起见，建议限制 API Key 的使用：

### Android 限制：
1. 在 Google Cloud Console 中找到你的 API Key
2. 点击 "Edit" → "Application restrictions"
3. 选择 "Android apps"
4. 添加你的应用包名和 SHA-1 证书指纹：
   - Package name: `com.discover.australia`
   - SHA-1 fingerprint: 运行以下命令获取：
     ```bash
     cd android
     ./gradlew signingReport
     ```

### iOS 限制：
1. 选择 "iOS apps"
2. 添加 Bundle ID: `com.discover.australia`

## 4. 重新构建应用

修改配置后，需要重新构建原生应用：

```bash
# 停止当前运行的 Expo 服务
# 然后重新运行：
npx expo prebuild --clean
npx expo run:android
# 或
npx expo run:ios
```

## 5. 验证配置

启动应用后，检查以下内容：
- ✅ 地图正常显示
- ✅ 标记点可以正常渲染
- ✅ 没有 "API key not authorized" 错误

## 常见问题

### Q: 地图显示空白或灰色？
A: 检查：
1. API Key 是否正确配置
2. 是否启用了正确的 API（Maps SDK for Android/iOS）
3. 查看控制台是否有错误信息

### Q: 出现 "API key not authorized" 错误？
A: 检查：
1. API Key 的限制设置是否正确
2. 包名/Bundle ID 是否匹配
3. SHA-1 指纹是否正确（仅 Android）

### Q: 开发环境和生产环境需要不同的 Key 吗？
A: 建议为开发和生产环境创建不同的 API Key，并分别设置限制。

## 费用说明

Google Maps Platform 提供每月 $200 的免费额度，对于大多数小型应用来说足够使用。超出部分按使用量计费。

详细定价请参考：https://cloud.google.com/maps-platform/pricing
