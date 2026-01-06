// module.exports = function (api) {
//   api.cache(true);
//   return {
//     presets: ['babel-preset-expo'],
//     plugins: [
//       [
//         'module-resolver',
//         {
//           root: ['./src'],
//           alias: {
//             '@': './src',
//             '@json': './assets/json',
//             '@img': './public/img',
//           },
//         },
//       ],
//       '@babel/plugin-proposal-export-namespace-from',
//       'react-native-worklets/plugin',
//     ],
//   };
// };

// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      // Module resolver for path aliases (required for Expo Router static analysis)
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '~': '.',
            '@': './src',
            'app': './src/app',
            '@json': './src/constants/json',
            '@img': './public/img',
            'utils': './src/utils',
          },
        },
      ],
      '@babel/plugin-proposal-export-namespace-from',
      'react-native-worklets/plugin',

      // MUST be last — Reanimated requires it
      // 'react-native-reanimated/plugin',
    ],
  };
};