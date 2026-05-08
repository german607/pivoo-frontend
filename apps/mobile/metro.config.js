const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force a single copy of React and React Native (including sub-paths like
// react-native/Libraries/...) so expo's nested react-native@0.80 / react@19
// never sneaks into the bundle alongside the app's versions.
const appNodeModules = path.resolve(projectRoot, 'node_modules');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    const sub = moduleName.slice('react'.length);
    return context.resolveRequest(
      { ...context, originModulePath: path.join(appNodeModules, 'react', 'index.js') },
      'react' + sub,
      platform,
    );
  }
  if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
    const sub = moduleName.slice('react-native'.length);
    return context.resolveRequest(
      { ...context, originModulePath: path.join(appNodeModules, 'react-native', 'index.js') },
      'react-native' + sub,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
