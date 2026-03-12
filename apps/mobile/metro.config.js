const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Resolver personalizado para lidar com módulos nativos no ambiente web
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && (
        moduleName.includes('codegenNativeCommands') ||
        moduleName.includes('codegenNativeComponent') ||
        moduleName.includes('react-native/Libraries/Utilities/codegen') ||
        moduleName.includes('react-native/Libraries/ReactNative/RendererProxy') ||
        moduleName.includes('react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore')
    )) {
        // console.log(`[MOCKING INTERCEPTION] INTERCEPTED: ${moduleName}`);
        return {
            type: 'sourceFile',
            filePath: path.join(__dirname, 'empty-mock.js'),
        };
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
