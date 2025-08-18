const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Add support for TypeScript and other extensions
  config.resolver.sourceExts.push('tsx', 'ts', 'jsx', 'js');

  // Support for both web and native platforms
  config.resolver.platforms = ['native', 'ios', 'android', 'web'];

  return config;
})();