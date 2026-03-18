// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Monorepo awareness: watch the entire repo + pnpm virtual store
config.watchFolders = [monorepoRoot];

// Resolve from app-local node_modules first, then root (node-linker=hoisted)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Pin RN singletons to app-local node_modules to prevent duplicate instances
const singletons = [
  'react',
  'react-native',
  'expo',
  'expo-router',
  'expo-modules-core',
  'expo-constants',
  '@expo/metro-runtime',
];

config.resolver.extraNodeModules = singletons.reduce((acc, pkg) => {
  acc[pkg] = path.resolve(projectRoot, 'node_modules', pkg);
  return acc;
}, {});

module.exports = withNativewind(config, { input: './global.css' });
