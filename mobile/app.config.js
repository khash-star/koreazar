const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

const COUNTRY_APP_OVERRIDES = {
  US: {
    name: "Zarusa",
    slug: "zarusa-app",
    scheme: "zarusa",
    ios: {
      bundleIdentifier: "com.zarusa.app",
    },
    android: {
      package: "com.zarusa.app",
    },
    photosPermission:
      "Zarusa uses your photo library only when you add images to a listing—for example, photos of items or services you want to show to buyers on the marketplace. Only the images you pick are used.",
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
    slug: overrides.slug,
    scheme: overrides.scheme,
    ios: { ...expo.ios, ...overrides.ios },
    android: { ...expo.android, ...overrides.android },
    plugins: Array.isArray(expo.plugins) ? [...expo.plugins] : [],
  };

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

  const androidGs = resolveGoogleServicesFile(
    process.env.GOOGLE_SERVICES_JSON,
    "google-services.json"
  );
  if (androidGs) {
    next.android.googleServicesFile = androidGs;
  } else {
    delete next.android.googleServicesFile;
  }

  const iosPlist = resolveGoogleServicesFile(
    process.env.GOOGLE_SERVICE_INFO_PLIST,
    "GoogleService-Info.plist"
  );
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
