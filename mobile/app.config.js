const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

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
  return {
    expo: withOptionalGoogleServices(base.expo),
  };
};
