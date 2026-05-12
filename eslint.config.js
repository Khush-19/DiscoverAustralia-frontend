import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 1. 忽略移动端特有的构建目录
  globalIgnores(['.expo', 'node_modules', 'android', 'ios', 'web-build']),

  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      // 如果你后续安装了 eslint-config-expo，可以在这里引用
    ],
    languageOptions: {
      // 2. 调整全局变量
      globals: {
        ...globals.browser, // React Native 也使用一些浏览器全局变量（如 fetch, console）
        ...globals.node,    // 某些配置文件需要 node 环境
        __DEV__: 'readonly', // React Native 特有的开发环境标志
      },
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // 3. 自定义一些移动端常用的规则
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': 'warn',
    },
  },
])
