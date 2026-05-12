import React, { createContext, useContext, useEffect, useReducer, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

// Keys used in the secure enclave — never stored in AsyncStorage
// 存储用户信息, 创建并导出了 AuthContext
const TOKEN_KEY = 'discover_au_jwt';
const USER_KEY = 'discover_au_user';

export const AuthContext = createContext(null);

// ─── Reducer ──────────────────────────────────────────────────────────────────
/*
作用：它定义了 App 状态如何变化。
原理：它是一个纯函数，接收当前状态和一张“指令单”（action），根据指令返回全新的状态。它不执行网络请求，只负责改数据。
*/
function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { ...state, userToken: action.token, user: action.user, isLoading: false };
    case 'SIGN_IN':
      return { ...state, userToken: action.token, user: action.user };
    case 'SIGN_OUT':
      return { ...state, userToken: null, user: null };
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
/*
作用：这是真正"管家"。它用 Reducer 生成状态，负责跟手机本地（SecureStore）和后端打交道。
它只负责管数据，不负责画界面。
*/
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    isLoading: true,   // true while we check secure storage on boot 初始状态为“加载中”，因为启动要查本地存储
    userToken: null,
    user: null,
  });

  // On app launch: read any persisted JWT from the secure enclave.
  // This keeps the user logged in across cold starts without storing
  // sensitive data in AsyncStorage (which is plaintext on disk).
  // 在 App 启动时，尝试从 secure enclave 读取之前存的 JWT（JSON Web Token）。
  // 这样即使手机关机重启（冷启动），用户也无需重新登录。
  // 关键点：这里用的是 expo-secure-store，它把敏感数据加密后存在 iOS 的 Keychain 或 Android 的 Keystore 里，
  // 绝对不会泄露到 AsyncStorage（明文存储）里。
  useEffect(() => {
    // 启动时的“自举”逻辑：检查手机里有没有存过 Token
    async function bootstrapAsync() {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const userJson = await SecureStore.getItemAsync(USER_KEY);
        const user = userJson ? JSON.parse(userJson) : null;
        dispatch({ type: 'RESTORE_TOKEN', token, user });
      } catch {
        // Secure store unavailable (e.g., first boot on fresh simulator) —
        // fall through to the auth flow.
        dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
      }
    }
    bootstrapAsync();
  }, []);

  // Memoised so child components don't re-render when unrelated state changes
  // 防止组件重复创建
  const authActions = useMemo(() => ({
    //登录
    signIn: async (email, password) => {
      // 1. 调用后端接口获取数据
      const { token, user } = await authService.login(email, password);
      // 2. 持久化存储到安全区域（即使 App 删了后台进程，数据还在）
      // Write to Keychain/Keystore via expo-secure-store (AES-256 on Android,
      // Secure Enclave on iOS) — JWT never touches AsyncStorage.
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));//压缩为字符串存入
      // 3. 派发 Action，更新全局状态（让 UI 知道已登录）
      dispatch({ type: 'SIGN_IN', token, user });
      return user;
    },
    //注册
    signUp: async (email, password, displayName) => {
      // 与signIn类似，只有接口调用的不同。
      const { token, user } = await authService.register(email, password, displayName);
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      dispatch({ type: 'SIGN_IN', token, user });
      return user;
    },
    //退出登录
    signOut: async () => {
      // Delete both keys so there is no stale credential in the enclave
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      // 还需要注销token
      dispatch({ type: 'SIGN_OUT' });
    },

  }), []);

  return (
    <AuthContext.Provider value={{ ...state, ...authActions }}>
      {children}
    </AuthContext.Provider>
  );
}
