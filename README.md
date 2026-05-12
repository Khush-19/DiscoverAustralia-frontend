# DiscoverAustralia-frontend

这是一个基于 **React Native (Expo)** 和 **Vite (Web)** 的双平台项目。

## 项目目录与文件说明

本项目分为 **项目核心文件** 和 **自动生成/缓存文件** 两大部分。

### 1. 项目核心文件 (Project Files)
这些是开发过程中需要重点关注和维护的代码与配置。

| 目录/文件 | 作用描述 |
| :--- | :--- |
| **`screens/`** | **页面组件**。包含应用的所有屏幕页面（如登录页、个人中心、主页等）。 |
| **`components/`** | **通用组件**。存放可复用的 UI 元素（如按钮、输入框、卡片等）。 |
| **`navigation/`** | **导航配置**。定义应用内的页面跳转逻辑和路由结构。 |
| **`services/`** | **后端服务/接口**。存放 API 请求代码（如对接后端数据）。 |
| **`context/`** | **状态管理**。使用 React Context API 处理全局状态（如用户信息、主题等）。 |
| **`hooks/`** | **自定义 Hook**。存放封装好的逻辑，以便在不同组件中复用。 |
| **`constants/`** | **常量配置**。存放配色方案、API 地址、固定的文字等。 |
| **`src/`** | **Web 端源码**。包含 Vite 开发网页时使用的入口 (`main.jsx`) 和样式 (`App.css`)。 |
| **`App.jsx`** | **移动端入口**。Expo 启动应用时加载的第一个 React 组件。 |
| **`app.json`** | **Expo 配置文件**。定义应用名称、图标、启动图、权限等移动端属性。 |
| **`package.json`** | **依赖管理**。记录项目使用的库（Dependencies）和运行脚本（Scripts）。 |
| **`tailwind.config.js`** | **样式配置**。如果你使用了 NativeWind 或 Tailwind CSS，这里定义了样式规则。 |
| **`metro.config.js`** | **移动端打包配置**。React Native 的资源打包器（Metro）的设置。 |
| **`vite.config.js`** | **Web 端打包配置**。Vite 工具的设置。 |
| **`global.css`** | **全局样式**。定义跨平台的 CSS 变量和基础样式。 |

---

### 2. 自动生成与缓存文件 (Auto-generated / Build Files)
这些文件由工具自动生成，通常不需要手动修改。

| 目录/文件 | 作用描述 | 来源 |
| :--- | :--- | :--- |
| **`.expo/`** | **开发缓存**。存储最近连接的设备信息和服务器设置。 | 运行 `npx expo start` 后生成。 |
| **`node_modules/`** | **依赖库**。存放所有下载的第三方代码包。 | 运行 `npm install` 后生成。 |
| **`package-lock.json`** | **版本锁定**。确保团队成员安装的库版本一致。 | 运行 `npm` 命令后自动更新。 |
| **`android/`** | **安卓原生工程**。包含 Java/Kotlin 原生代码。 | 运行 `npx expo prebuild` 生成。 |

---

### 3. 其他文件
- **`.gitignore`**: 指定 Git 忽略的文件和文件夹。
- **`index.html`**: Web 端的 HTML 模版入口。
- **`README.md`**: 项目说明文档（本文件）。
- **`babel.config.js`**: JavaScript 转译配置。
- **`eslint.config.js`**: 代码规范检查配置。

## 开发建议
1. **日常编码**：核心逻辑主要分布在 `screens/`、`components/` 和 `App.jsx`。
2. **清理缓存**：如果遇到奇怪的编译问题，可以尝试删除 `.expo/` 或 `node_modules/` 并重新安装依赖。
3. **配置文件**：修改 `app.json` 或 `package.json` 后，通常需要重新启动开发服务器。