const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro 打包配置
 * 默认 + 支持 monorepo (workspace 符号链接)
 */
const config = {
  resolver: {
    // monorepo 支持:workspace 包优先
    nodeModulesPaths: ['../../node_modules', './node_modules'],
  },
  watchFolders: ['../../node_modules'],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);