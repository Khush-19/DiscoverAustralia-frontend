// constants/config.js

const CONFIG = {
    // 使用 Settings.env 读取 .env 文件中的变量, 若不存在则为默认地址
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://X.0.2.2:8000',
    TIMEOUT: 10000,
    USE_MOCK: false,
};

export default CONFIG;
