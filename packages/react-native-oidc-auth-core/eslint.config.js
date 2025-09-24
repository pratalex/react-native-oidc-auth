// https://docs.expo.dev/guides/using-eslint/
const {globalIgnores, defineConfig} = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  globalIgnores(['dist/*']),
  expoConfig,
  {
    rules: {
      indent: ['error', 2],
      'prettier/prettier': 'off',
    },
  },
  eslintPluginPrettierRecommended,
]);
