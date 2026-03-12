const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Resolver aliases: @/hooks/* → hooks/* ou src/hooks/*
// Garante que o Metro resolva os mesmos paths que o tsconfig define
const MOBILE_ROOT = __dirname;
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Resolver modules nativos para web (mock)
    if (platform === 'web' && (
        moduleName.includes('codegenNativeCommands') ||
        moduleName.includes('codegenNativeComponent') ||
        moduleName.includes('react-native/Libraries/Utilities/codegen') ||
        moduleName.includes('react-native/Libraries/ReactNative/RendererProxy') ||
        moduleName.includes('react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore')
    )) {
        return {
            type: 'sourceFile',
            filePath: path.join(MOBILE_ROOT, 'empty-mock.js'),
        };
    }

    // Resolver aliases @/xxx → tenta raiz primeiro, depois src/
    if (moduleName.startsWith('@/')) {
        const subPath = moduleName.slice(2); // remove '@/'
        const candidates = [
            path.join(MOBILE_ROOT, subPath),
            path.join(MOBILE_ROOT, 'src', subPath),
        ];
        for (const candidate of candidates) {
            for (const ext of ['', '.ts', '.tsx', '.js', '.jsx']) {
                try {
                    return context.resolveRequest(context, candidate + ext, platform);
                } catch {
                    // tenta próximo
                }
            }
        }
    }

    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;


