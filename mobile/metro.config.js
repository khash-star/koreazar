const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Include web src for shared constants (listings.js)
config.watchFolders = [projectRoot, path.resolve(monorepoRoot, "src")];

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
