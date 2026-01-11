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
    },
  }
]);
