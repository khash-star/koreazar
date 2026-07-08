const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

const COUNTRY_APP_OVERRIDES = {
  US: {
    name: "ZAR-USA",
    // Keep slug aligned with app.json / EAS project (zarkorea-app) — only display name differs.
    scheme: "zarusa",
    icon: "./assets/us/icon-ios-1024.png",
    splash: {
      image: "./assets/us/splash-icon.png",
    },
    ios: {
      bundleIdentifier: "com.zarusa.app",
      icon: "./assets/us/icon-ios-1024.png",
    },
    android: {
      package: "com.zarusa.app",
      adaptiveIcon: {
        foregroundImage: "./assets/us/android-icon-foreground.png",
        monochromeImage: "./assets/us/android-icon-monochrome.png",
      },
    },
    photosPermission:
      "ZAR-USA uses your photo library only when you add images to a listing—for example, photos of items or services you want to show to buyers on the marketplace. Only the images you pick are used.",
  },
};

function normalizeCountryCode(value) {
  return String(value || "").trim().toUpperCase();
}

function applyCountryAppOverrides(expo) {
  const code = normalizeCountryCode(process.env.EXPO_PUBLIC_ACTIVE_COUNTRY);
  const overrides = COUNTRY_APP_OVERRIDES[code];
  if (!overrides) return expo;

  const next = {
    ...expo,
    name: overrides.name,
    scheme: overrides.scheme,
    ios: { ...expo.ios, ...overrides.ios },
    android: { ...expo.android, ...overrides.android },
    plugins: Array.isArray(expo.plugins) ? [...expo.plugins] : [],
  };
  if (overrides.slug) next.slug = overrides.slug;
  if (overrides.icon) next.icon = overrides.icon;
  if (overrides.splash) {
    next.splash = { ...expo.splash, ...overrides.splash };
  }

  if (overrides.android?.adaptiveIcon) {
    next.android.adaptiveIcon = {
      ...expo.android?.adaptiveIcon,
      ...overrides.android.adaptiveIcon,
    };
  }

  if (overrides.photosPermission) {
    next.plugins = next.plugins.map((plugin) => {
      if (Array.isArray(plugin) && plugin[0] === "expo-image-picker") {
        return ["expo-image-picker", { photosPermission: overrides.photosPermission }];
      }
      return plugin;
    });
  }

  return next;
}

/** EAS file env (production cloud build) or local gitignored files. */
function resolveGoogleServicesFile(envPath, localRelative) {
  if (envPath && typeof envPath === "string" && fs.existsSync(envPath)) {
    return envPath;
  }
  const localAbs = path.join(__dirname, localRelative);
  if (fs.existsSync(localAbs)) {
    return localRelative;
  }
  return null;
}

/** Firebase native config — omit when missing (avoids Expo parse errors on Expo Go). */
function withOptionalGoogleServices(expo) {
  const next = { ...expo, ios: { ...expo.ios }, android: { ...expo.android } };
  const isUs = normalizeCountryCode(process.env.EXPO_PUBLIC_ACTIVE_COUNTRY) === "US";

  const androidGs = resolveGoogleServicesFile(
    process.env.GOOGLE_SERVICES_JSON,
    "google-services.json"
  );
  if (androidGs) {
    next.android.googleServicesFile = androidGs;
  } else {
    delete next.android.googleServicesFile;
  }

  const iosPlistEnv = isUs
    ? process.env.GOOGLE_SERVICE_INFO_PLIST_US || process.env.GOOGLE_SERVICE_INFO_PLIST
    : process.env.GOOGLE_SERVICE_INFO_PLIST;
  const iosPlistLocal = isUs ? "GoogleService-Info.zarusa.plist" : "GoogleService-Info.plist";
  const iosPlist = resolveGoogleServicesFile(iosPlistEnv, iosPlistLocal);
  if (iosPlist) {
    next.ios.googleServicesFile = iosPlist;
  } else {
    delete next.ios.googleServicesFile;
  }

  return next;
}

module.exports = ({ config }) => {
  const base = config?.expo ? config : appJson;
  const withCountry = applyCountryAppOverrides(base.expo);
  return {
    expo: withOptionalGoogleServices(withCountry),
  };
};
