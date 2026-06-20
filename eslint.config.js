// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // Noisy for RN/Expo copy-heavy screens.
      "react/no-unescaped-entities": "off",
      // Expo SDK 56's React Compiler-era hook rules are too noisy for the
      // current codebase; revisit them in a dedicated cleanup pass.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  }
]);
