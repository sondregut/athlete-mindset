const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add support for .cjs files (CommonJS modules)
defaultConfig.resolver.sourceExts.push('cjs');

// Disable unstable package exports to fix Firebase v11 compatibility
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;