const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const fallbackScreenPath = path.resolve(
  __dirname,
  "src/shims/bottom-tabs/ScreenFallback.js"
);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath?.replace(/\\/g, "/") || "";

  if (
    moduleName === "./ScreenFallback.js" &&
    origin.includes("@react-navigation/bottom-tabs") &&
    origin.includes("BottomTabView")
  ) {
    return { type: "sourceFile", filePath: fallbackScreenPath };
  }

  if (typeof defaultResolveRequest === "function") {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
