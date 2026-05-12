// constants/config.js

const CONFIG = {
    // 使用 Settings.env 读取 .env 文件中的变量
    API_URL: process.env.EXPO_PUBLIC_API_URL,
    TIMEOUT: 10000,
};

export default CONFIG;
