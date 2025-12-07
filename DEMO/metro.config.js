const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// 默认配置
const defaultConfig = getDefaultConfig(__dirname);

// 自定义配置
const customConfig = {
    watchFolders: [
        // 让 RN 监听你本地 SDK 的目录
        path.resolve(__dirname, '../juggleim-rnsdk'),
    ],

    resolver: {
        // 确保 SDK 中依赖都指向 DEMO/node_modules
        extraNodeModules: new Proxy(
            {},
            {
                get: (_, name) => path.join(__dirname, 'node_modules', name),
            }
        ),
    },
};

// 合并默认配置 + 自定义扩展
module.exports = mergeConfig(defaultConfig, customConfig);
