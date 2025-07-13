const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Enable minification for production builds
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    ecma: 8,
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
};

// Add support for .cjs files (CommonJS modules)
defaultConfig.resolver.sourceExts.push('cjs');

// Disable unstable package exports to fix Firebase v11 compatibility
defaultConfig.resolver.unstable_enablePackageExports = false;

// Optimize asset loading
defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter(
  ext => !['md', 'txt', 'html', 'map'].includes(ext)
);

// Fix for use-latest-callback module resolution
defaultConfig.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add extra node modules mapping to handle the problematic import
defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  'use-latest-callback/lib/src/useIsomorphicLayoutEffect': path.resolve(
    __dirname,
    'node_modules/use-latest-callback/lib/src/useIsomorphicLayoutEffect.js'
  ),
};

// Custom resolver for handling module resolution issues
const originalResolveRequest = defaultConfig.resolver.resolveRequest;
defaultConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle the specific use-latest-callback issue
  if (moduleName.startsWith('./') && context.originModulePath.includes('use-latest-callback')) {
    const basePath = path.dirname(context.originModulePath);
    const resolvedPath = path.resolve(basePath, moduleName);
    
    // Check for platform-specific versions first
    if (platform === 'native' || platform === 'ios' || platform === 'android') {
      const nativePath = resolvedPath + '.native';
      try {
        return {
          filePath: require.resolve(nativePath),
          type: 'sourceFile',
        };
      } catch (e) {
        // Fall through to regular resolution
      }
    }
    
    // Try regular resolution
    try {
      return {
        filePath: require.resolve(resolvedPath),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fall through to default resolution
    }
  }
  
  // Default resolution
  return originalResolveRequest ? originalResolveRequest(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

// Add network-related configurations
defaultConfig.server = {
  ...defaultConfig.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Allow CORS for all requests during development
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

module.exports = defaultConfig;