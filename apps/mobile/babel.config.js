module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@network': './src/network',
          '@db': './src/db',
          '@utils': './src/utils',
        },
      },
    ],
    'react-native-reanimated/plugin', // 必须放在最后
  ],
};