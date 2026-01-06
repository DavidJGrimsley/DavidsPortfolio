const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require('uniwind/metro');
const { resolve } = require('metro-resolver');
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Use resolveRequest for reliable path alias resolution
// This is more reliable than resolver.alias with some Metro configurations
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @/ alias -> src/
  if (moduleName.startsWith('@/')) {
    const newPath = path.resolve(__dirname, 'src', moduleName.slice(2));
    return resolve(context, newPath, platform);
  }

  // Handle @json/ alias -> src/constants/json/
  if (moduleName.startsWith('@json/')) {
    const newPath = path.resolve(__dirname, 'src/constants/json', moduleName.slice(6));
    return resolve(context, newPath, platform);
  }

  // Handle @img/ alias -> public/img/
  if (moduleName.startsWith('@img/')) {
    const newPath = path.resolve(__dirname, 'public/img', moduleName.slice(5));
    return resolve(context, newPath, platform);
  }

  // Handle ~/ alias -> ./
  if (moduleName.startsWith('~/')) {
    const newPath = path.resolve(__dirname, moduleName.slice(2));
    return resolve(context, newPath, platform);
  }

  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
});