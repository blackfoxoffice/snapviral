module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@': './',
          '@newsflow/shared': '../../packages/shared/src',
        },
      }],
      'react-native-reanimated/plugin',
    ],
  };
};
